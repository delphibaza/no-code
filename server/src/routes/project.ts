import { STARTER_TEMPLATES } from "@repo/common/constants";
import type {
  BlankTemplateProject,
  NewProject,
  Template,
} from "@repo/common/types";
import { promptSchema } from "@repo/common/zod";
import prisma from "@repo/db/client";
import express, { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import { ensureUserExists } from "../middleware/ensureUser";
import { resetLimits } from "../middleware/resetLimits";
import {
  createProjectFiles,
  enhanceProjectPrompt,
  getProject,
  getTemplateData,
  selectTemplate,
  validateProjectOwnership,
} from "../services/projectService";
import {
  checkAndUpdateTokenUsage,
  checkLimits,
  updateSubscription,
} from "../services/subscriptionService";
import { getTemplate } from "../utils/getTemplate";
import { ApplicationError } from "../utils/timeHelpers";
import { getGitHubRepoContent, DANGEROUS_PATTERNS } from "../utils/getRepoContent";

const router = express.Router();

router.post("/new", ensureUserExists, async (req: Request, res: Response) => {
  const validation = promptSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message,
    });
    return;
  }
  if (!req.auth.userId) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }
  const { prompt, templateName } = validation.data;
  try {
    let projectName: string;
    // If template is selected, use template label as project name
    if (templateName) {
      const existingTemplate = STARTER_TEMPLATES.find(
        (t) => t.name === templateName.trim()
      );

      if (!existingTemplate) {
        throw new ApplicationError("Template not found", 404);
      }
      projectName = existingTemplate.label;
    } else {
      projectName = prompt.slice(0, 25);
    }
    const newProject = await prisma.project.create({
      data: {
        name: projectName,
        templateName,
        userId: req.auth.userId,
        state: templateName ? "blankTemplate" : "new",
        messages: {
          create: {
            role: "user",
            content: { text: prompt },
          },
        },
      },
    });
    res.json({
      projectId: newProject.id,
    });
  } catch (error) {
    if (error instanceof ApplicationError) {
      res.status(error.code).json({ message: error.message });
      return;
    }
    console.log(error);
    res.status(500).json({
      msg: "Failed to create project",
    });
  }
});

// Route to get a project whether new or existing - requires auth + subscription
router.post("/project/:projectId", resetLimits, async (req, res) => {
  const { projectId } = req.params;
  try {
    // Validate project state
    const project = await getProject(projectId);

    if (!project || project.messages.length === 0) {
      throw new ApplicationError("Project not found", 404);
    }

    // If the project has already generated, return the existing project
    if (project.state === "existing") {
      res.json({
        state: "existing",
        messages: project.messages,
        projectFiles: project.files,
        ignorePatterns: project.ignorePatterns,
      });
      return;
    }
    // If the user has selected a blank template
    if (project.state === "blankTemplate") {
      // Blank template needs a template name
      if (!project.templateName) {
        throw new ApplicationError("Template not found", 404);
      }
      const templateName = project.templateName.trim();
      // Try to get template from cache
      let templateData: Template | null = null;
      try {
        const templatePath = path.join(
          __dirname,
          "cache",
          `${templateName}.json`
        );
        await fs.access(templatePath);
        const data = await fs.readFile(templatePath, "utf8");
        templateData = JSON.parse(data) as Template;
      } catch {
        // If not in cache, fetch from GitHub
        templateData = await getTemplate(templateName);
        if (!templateData) {
          throw new ApplicationError("Unable to retrieve template", 404);
        }
      }
      // Create project files
      if (project.files.length === 0) {
        await createProjectFiles(project.id, templateData.templateFiles);
      }
      // Store ignore patterns if not already stored
      if (
        project.ignorePatterns.length === 0 &&
        templateData.ignorePatterns.length > 0
      ) {
        await prisma.project.update({
          where: { id: project.id },
          data: { ignorePatterns: templateData.ignorePatterns },
        });
      }
      // Not returning the enhanced prompt unlike for a new project
      res.json({
        state: "blankTemplate",
        templateFiles: templateData.templateFiles,
        templatePrompt: templateData.templatePrompt,
        ignorePatterns: templateData.ignorePatterns,
      } as BlankTemplateProject);
      return;
    }

    if (!req.plan) {
      throw new ApplicationError(
        "Unable to get token limits for the user",
        403
      );
    }
    // Check the limits
    const limitsCheck = checkLimits(req.plan);

    if (!limitsCheck.success) {
      throw new ApplicationError(
        limitsCheck.message ?? "You have reached your token limit",
        402
      );
    }
    // Step 1: Enhance the prompt, with the initial prompt message
    const { enhancedPrompt, usage: enhanceUsage } = await enhanceProjectPrompt(
      (project.messages[0].content as { text: string }).text
    );

    // Update token usage and check limits
    req.plan.dailyTokensUsed += enhanceUsage.totalTokens;
    req.plan.monthlyTokensUsed += enhanceUsage.totalTokens;

    // Check the limits
    await checkAndUpdateTokenUsage(req.plan);

    // Step 2: Select appropriate template(s) based on the enhanced prompt
    const {
      templates,
      projectTitle,
      usage: templateUsage,
    } = await selectTemplate(enhancedPrompt);

    // Update token usage and check limits
    req.plan.dailyTokensUsed += templateUsage.totalTokens;
    req.plan.monthlyTokensUsed += templateUsage.totalTokens;

    // Check the limits
    await checkAndUpdateTokenUsage(req.plan);

    // Step 3: Get template data and create project files
    const templateData = await getTemplateData(templates);

    // When the page is refreshed, the project files are not created again
    if (project.files.length === 0) {
      await createProjectFiles(project.id, templateData.templateFiles);
    }

    // Update the project with new title
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: projectTitle ?? project.name.slice(0, 25),
        ignorePatterns: templateData.ignorePatterns,
      },
    });

    // Persist updated token usage to the database
    await updateSubscription(req.plan);

    res.json({
      state: "new",
      enhancedPrompt: enhancedPrompt,
      templateFiles: templateData.templateFiles,
      templatePrompt: templateData.templatePrompt,
      ignorePatterns: templateData.ignorePatterns,
    } as NewProject);
  } catch (error) {
    if (error instanceof ApplicationError) {
      res.status(error.code).json({ message: error.message });
      return;
    }
    console.log("Project generation failed:", error);

    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to generate template",
    });
  }
});

router.get("/projects", async (req, res) => {
  const { page = "0", limit = "10" } = req.query;
  if (isNaN(Number(page)) || isNaN(Number(limit))) {
    res.status(400).json({
      msg: "Invalid page or limit",
    });
    return;
  }
  try {
    const projects = await prisma.project.findMany({
      where: {
        userId: req.auth.userId!,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: Number(page) * Number(limit),
      take: Number(limit),
    });
    res.json({
      projects,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Failed to get projects",
    });
  }
});

// Route to get the current project state
router.get("/project-state/:projectId", async (req, res) => {
  const { projectId } = req.params;
  if (!projectId) {
    res.status(400).json({
      msg: "Project ID is required",
    });
    return;
  }
  if (!req.auth.userId) {
    res.status(403).json({ msg: "Unauthorized" });
    return;
  }
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId: req.auth.userId,
      },
      select: {
        state: true,
      },
    });
    if (!project) {
      throw new ApplicationError("Project not found", 404);
    }
    res.json({
      state: project.state,
    });
  } catch (error) {
    if (error instanceof ApplicationError) {
      res.status(error.code).json({ msg: error.message });
      return;
    }
    console.log(error);
    res.status(500).json({
      msg: "Failed to get project state",
    });
  }
});

// Route to delete a project
router.delete("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;
  if (!projectId) {
    res.status(400).json({
      msg: "Project ID is required",
    });
    return;
  }
  if (!req.auth.userId) {
    res.status(403).json({ msg: "Unauthorized" });
    return;
  }
  try {
    await validateProjectOwnership(projectId, req.auth.userId);
    await prisma.project.delete({
      where: {
        id: projectId,
        userId: req.auth.userId,
      },
    });
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Failed to delete project",
    });
  }
});

// Импорт файлов из публичного репозитория GitHub по URL
router.post("/import-github", ensureUserExists, async (req, res) => {
  const { repoUrl, projectName, branch, userToken } = req.body;
  const isPreview = req.query.preview === 'true';
  if (!repoUrl) {
    return res.status(400).json({ message: "Missing repoUrl" });
  }
  // Пример: https://github.com/user/repo или https://github.com/user/repo/tree/main/subfolder
  const match = repoUrl.match(
    /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)\/(.*))?/
  );
  if (!match) {
    return res.status(400).json({ message: "Invalid GitHub repo URL" });
  }
  const owner = match[1];
  const repo = match[2];
  // Если указан путь к подпапке
  const folder = match[4] || "";
  const repoName = `${owner}/${repo}`;
  const branchName = branch || match[3] || "main";
  try {
    // Получаем все файлы из репозитория или подпапки
    const files = await getGitHubRepoContent(repoName, folder, branchName, userToken);
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No files found in the repository (или все файлы были отфильтрованы)" });
    }
    if (isPreview) {
      // Только preview структуры файлов
      return res.json({ projectFiles: files.map(f => ({ filePath: f.filePath, name: f.name })), filteredPatterns: DANGEROUS_PATTERNS.map(r => r.toString()) });
    }
    // Создаем проект для пользователя
    const userId = req.auth.userId;
    const newProject = await require("@repo/db/client").project.create({
      data: {
        name: projectName || repo,
        userId,
        state: "blankTemplate",
        templateName: null,
        messages: {
          create: {
            role: "user",
            content: { text: `Imported from ${repoUrl} (branch: ${branchName})` },
          },
        },
      },
    });
    // Сохраняем файлы в проект
    await require("../services/projectService").createProjectFiles(newProject.id, files);
    res.json({
      projectId: newProject.id,
      projectFiles: files,
      state: "blankTemplate",
      filteredPatterns: DANGEROUS_PATTERNS.map(r => r.toString()),
    });
  } catch (error) {
    let message = error && error.message ? error.message : "Failed to import from GitHub";
    // Улучшенная детализация ошибок
    if (message.includes("rate limit")) {
      message += ". Попробуйте позже или используйте персональный GitHub-токен.";
    }
    res.status(500).json({ message });
  }
});

export default router;
