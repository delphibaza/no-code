import { STARTER_TEMPLATES } from "@repo/common/constants";
import { Template } from "@repo/common/types";
import prisma from "@repo/db/client";
import { generateText } from "ai";
import { promises as fs } from "fs";
import path from "path";
import { enhancerPrompt } from "../prompts/enhancerPrompt";
import {
  parseSelectedTemplate,
  starterTemplateSelectionPrompt,
} from "../prompts/starterTemplateSelection";
import { selectorModel } from "../providers";
import { getTemplate } from "../utils/getTemplate";
import { ApplicationError } from "../utils/timeHelpers";

export interface TemplateInfo {
  name: string;
  type: "frontend" | "backend";
}

export const getProject = async (projectId: string) => {
  return await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      files: {
        select: {
          id: true,
          filePath: true,
          content: true,
          timestamp: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
};

export const getTemplateData = async (
  templateNames: TemplateInfo[]
): Promise<Template> => {
  let combinedTemplateData: Template = {
    templateFiles: [],
    ignorePatterns: [],
    templatePrompt: "",
  };

  const needsFrontendBackendSplit = templateNames.length > 1;

  // Process each template (either from cache or GitHub)
  for (const template of templateNames) {
    let templateData: Template | null = null;

    // Try to get template from cache
    try {
      const templatePath = path.join(
        __dirname,
        "cache",
        `${template.name}.json`
      );
      await fs.access(templatePath);
      const data = await fs.readFile(templatePath, "utf8");
      templateData = JSON.parse(data) as Template;
    } catch {
      // If not in cache, fetch from GitHub
      templateData = await getTemplate(template.name);
      if (!templateData) {
        throw new Error(
          "Unable to initialize the project. Please try again with a different prompt."
        );
      }
    }

    // Merge template data with appropriate prefixes
    mergeTemplateData(
      combinedTemplateData,
      templateData,
      template.type,
      needsFrontendBackendSplit
    );
  }

  return combinedTemplateData;
};

/**
 * Merges template data into the combined template with appropriate prefixes
 */
function mergeTemplateData(
  combinedTemplate: Template,
  templateToMerge: Template,
  templateType: "frontend" | "backend",
  needsFrontendBackendSplit: boolean
): void {
  // Determine folder prefix
  const folderPrefix = needsFrontendBackendSplit
    ? templateType === "backend"
      ? "backend"
      : "frontend"
    : "";

  // Add files with proper path prefixes, ex: frontend/index.html
  combinedTemplate.templateFiles.push(
    ...templateToMerge.templateFiles.map((file) => ({
      ...file,
      filePath: addPrefixIfNeeded(file.filePath, folderPrefix),
    }))
  );

  // Add ignore patterns with proper path prefixes
  combinedTemplate.ignorePatterns.push(
    ...templateToMerge.ignorePatterns.map((pattern) =>
      addPrefixIfNeeded(pattern, folderPrefix)
    )
  );

  // Append template prompt
  combinedTemplate.templatePrompt +=
    (combinedTemplate.templatePrompt ? "\n\n" : "") +
    (needsFrontendBackendSplit ? templateType + " template prompt:\n" : "") +
    templateToMerge.templatePrompt;
}

/**
 * Adds a prefix to a path if needed
 */
function addPrefixIfNeeded(path: string, prefix: string): string {
  return prefix ? `${prefix}/${path}` : path;
}

export async function validateProjectOwnership(
  projectId: string,
  userId: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    throw new ApplicationError("Project not found", 404);
  }
  if (project.userId !== userId) {
    throw new ApplicationError(
      "You are not allowed to access this project",
      403
    );
  }

  return project;
}

export async function createProjectFiles(
  projectId: string,
  templateFiles: Template["templateFiles"]
) {
  await prisma.file.createMany({
    data: templateFiles.map((file) => ({
      projectId,
      filePath: file.filePath,
      content: file.content,
    })),
  });
}

export async function selectTemplate(enhancedPrompt: string) {
  const {
    text: templateXML,
    finishReason,
    usage,
  } = await generateText({
    model: selectorModel,
    system: starterTemplateSelectionPrompt(STARTER_TEMPLATES),
    prompt: enhancedPrompt,
  });

  if (finishReason !== "stop") {
    throw new ApplicationError(
      "Error occurred while creating the project",
      500
    );
  }

  const { frontendTemplate, backendTemplate, projectTitle } =
    parseSelectedTemplate(templateXML);

  if (!frontendTemplate && !backendTemplate) {
    throw new ApplicationError(
      "Error occurred while identifying a template",
      500
    );
  }

  const templates = [
    {
      name: frontendTemplate,
      type: "frontend" as const,
    },
    {
      name: backendTemplate,
      type: "backend" as const,
    },
  ].filter((t): t is TemplateInfo => t.name !== null);

  return { templates, projectTitle, usage };
}

export async function enhanceProjectPrompt(projectName: string) {
  const { text, finishReason, usage } = await generateText({
    model: selectorModel,
    system: enhancerPrompt(),
    prompt: projectName,
  });
  // We don't want to charge the user for a partial response
  if (finishReason !== "stop") {
    console.log({ finishReason, usage });
    throw new ApplicationError(
      "Error occurred while creating the project",
      500
    );
  }

  return { enhancedPrompt: text, usage };
}
