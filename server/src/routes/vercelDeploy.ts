import express, { Request, Response } from "express";
import { DeployRequestBody, SiteInfo } from "./netlifyDeploy";
import { validateProjectOwnership } from "../services/projectService";

const router = express.Router();

router.post("/vercel-deploy", async (req: Request, res: Response) => {
  try {
    const { siteId, files, token, chatId } = req.body as DeployRequestBody & {
      token: string;
    };
    // Validate project ownership
    await validateProjectOwnership(chatId, req.auth.userId!);

    if (!token) {
      res.status(401).json({ error: "Not connected to Vercel" });
      return;
    }

    if (!files || Object.keys(files).length === 0) {
      res.status(400).json({ error: "No files provided" });
      return;
    }

    let targetProjectId = siteId;
    let projectInfo: SiteInfo | undefined;

    // If no projectId provided, create a new project
    if (!targetProjectId) {
      const projectName = `no-code-${chatId}-${Date.now()}`;
      const createProjectResponse = await fetch(
        "https://api.vercel.com/v9/projects",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName,
            framework: null,
          }),
        }
      );

      if (!createProjectResponse.ok) {
        const errorData = (await createProjectResponse.json()) as any;
        res.status(400).json({
          error: `Failed to create project: ${
            errorData.error?.message || "Unknown error"
          }`,
        });
        return;
      }

      const newProject = (await createProjectResponse.json()) as any;
      targetProjectId = newProject.id;
      projectInfo = {
        id: newProject.id,
        name: newProject.name,
        url: `https://${newProject.name}.vercel.app`,
        chatId,
      };
    } else {
      // Get existing project info
      const projectResponse = await fetch(
        `https://api.vercel.com/v9/projects/${targetProjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (projectResponse.ok) {
        const existingProject = (await projectResponse.json()) as any;
        projectInfo = {
          id: existingProject.id,
          name: existingProject.name,
          url: `https://${existingProject.name}.vercel.app`,
          chatId,
        };
      } else {
        // If project doesn't exist, create a new one
        const projectName = `no-code-${chatId}-${Date.now()}`;
        const createProjectResponse = await fetch(
          "https://api.vercel.com/v9/projects",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: projectName,
              framework: null,
            }),
          }
        );

        if (!createProjectResponse.ok) {
          const errorData = (await createProjectResponse.json()) as any;
          res.status(400).json({
            error: `Failed to create project: ${
              errorData.error?.message || "Unknown error"
            }`,
          });
          return;
        }

        const newProject = (await createProjectResponse.json()) as any;
        targetProjectId = newProject.id;
        projectInfo = {
          id: newProject.id,
          name: newProject.name,
          url: `https://${newProject.name}.vercel.app`,
          chatId,
        };
      }
    }

    // Prepare files for deployment
    const deploymentFiles = [];

    for (const [filePath, content] of Object.entries(files)) {
      // Ensure file path doesn't start with a slash for Vercel
      const normalizedPath = filePath.startsWith("/")
        ? filePath.substring(1)
        : filePath;
      deploymentFiles.push({
        file: normalizedPath,
        data: content,
      });
    }

    // Create a new deployment
    const deployResponse = await fetch(
      `https://api.vercel.com/v13/deployments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectInfo.name,
          project: targetProjectId,
          target: "production",
          files: deploymentFiles,
          routes: [{ src: "/(.*)", dest: "/$1" }],
        }),
      }
    );

    if (!deployResponse.ok) {
      const errorData = (await deployResponse.json()) as any;
      res.status(400).json({
        error: `Failed to create deployment: ${
          errorData.error?.message || "Unknown error"
        }`,
      });
      return;
    }

    const deployData = (await deployResponse.json()) as any;

    // Poll for deployment status
    let retryCount = 0;
    const maxRetries = 60;
    let deploymentUrl = "";
    let deploymentState = "";

    while (retryCount < maxRetries) {
      const statusResponse = await fetch(
        `https://api.vercel.com/v13/deployments/${deployData.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (statusResponse.ok) {
        const status = (await statusResponse.json()) as any;
        deploymentState = status.readyState;
        deploymentUrl = status.url ? `https://${status.url}` : "";

        if (status.readyState === "READY" || status.readyState === "ERROR") {
          break;
        }
      }

      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (deploymentState === "ERROR") {
      res.status(500).json({ error: "Deployment failed" });
      return;
    }

    if (retryCount >= maxRetries) {
      res.status(500).json({ error: "Deployment timed out" });
      return;
    }

    res.json({
      success: true,
      deploy: {
        id: deployData.id,
        state: deploymentState,
        url: deploymentUrl || projectInfo.url,
      },
      project: projectInfo,
    });
  } catch (error) {
    console.error("Error deploying to Vercel:", error);
    res.status(500).json({ error: "Failed to deploy to Vercel" });
    return;
  }
});

export default router;
