import { webcontainer } from "@/config/webContainer";
import { API_URL } from "@/lib/constants";
import { path as pathLib } from "@/lib/path";
import { customToast } from "@/lib/utils";
import { actionRunner } from "@/services/action-runner";
import { useNetlifyStore } from "@/stores/netlify";
import { useProjectStore } from "@/stores/project";
import { useVercelStore } from "@/stores/vercel";
import { WORK_DIR } from "@repo/common/constants";
import {
  Artifact,
  MessageHistory,
  ShellAction
} from "@repo/common/types";
import { WebContainer } from "@webcontainer/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";
import useFetch from "./useFetch";

// Get all files recursively
async function getAllFiles(
  dirPath: string,
  finalBuildPath: string,
  container: WebContainer,
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const entries = await container.fs.readdir(dirPath, {
    withFileTypes: true,
  });
  for (const entry of entries) {
    const fullPath = pathLib.join(dirPath, entry.name);
    if (entry.isFile()) {
      const content = await container.fs.readFile(fullPath, "utf-8");
      // Remove /dist prefix from the path
      const deployPath = fullPath.replace(finalBuildPath, "");
      files[deployPath] = content;
    } else if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, finalBuildPath, container);
      Object.assign(files, subFiles);
    }
  }
  return files;
}

export function useHandleDeploy() {
  const { validatedNetlifyToken } = useNetlifyStore(
    useShallow((state) => ({
      validatedNetlifyToken: state.validatedToken,
    })),
  );
  const { validatedVercelToken } = useVercelStore(
    useShallow((state) => ({
      validatedVercelToken: state.validatedToken,
    })),
  );
  const { customFetch } = useFetch();
  const [deployingTo, setDeployingTo] = useState<"netlify" | "vercel" | null>(
    null,
  );
  const {
    currentProjectId,
    addAction,
    upsertMessage,
    setCurrentMessageId,
    updateActionStatus,
  } = useProjectStore(
    useShallow((state) => ({
      currentProjectId: state.currentProjectId,
      upsertMessage: state.upsertMessage,
      addAction: state.addAction,
      updateActionStatus: state.updateActionStatus,
      setCurrentMessageId: state.setCurrentMessageId,
    })),
  );

  // Generic deployment handler function
  const handleDeploy = async (platform: "netlify" | "vercel") => {
    // Get the appropriate token based on platform
    const token =
      platform === "netlify" ? validatedNetlifyToken : validatedVercelToken;
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

    if (!token) {
      customToast(
        `Please connect to ${platformName} first in the settings tab!`,
      );
      return;
    }

    if (!currentProjectId) {
      customToast("No active project found");
      return;
    }

    const messageId = "build-" + Date.now();
    try {
      setDeployingTo(platform);
      setCurrentMessageId(messageId);

      // Create a shell action for the build command
      const action: ShellAction = {
        id: 0,
        type: "shell",
        command: "npm run build",
      };

      // Create an artifact object with the build action
      const artifact: Artifact = {
        title: `${platformName} Deployment`,
        initialContext: `Building the project for deployment to ${platformName}...`,
        actions: [action],
        endingContext: "",
      };

      const initialDeploymentMsg: MessageHistory = {
        id: messageId,
        timestamp: new Date().getTime(),
        role: "assistant" as const,
        content: JSON.stringify({ artifact }),
      };

      // Add the message to the store
      upsertMessage(initialDeploymentMsg);

      // Directly run the build action
      addAction(messageId, {
        ...action,
        state: "running",
      });

      // Run the action
      const buildOutput = await actionRunner.runBuildAction();

      updateActionStatus(messageId, 0, "completed");

      // Update the message
      const endingContext =
        "Build completed successfully, please wait for the deployment URL to be generated...";

      upsertMessage({
        ...initialDeploymentMsg,
        content: JSON.stringify({
          artifact: {
            ...artifact,
            endingContext,
          },
        }),
      });

      // Get the build files
      const container = await webcontainer;

      // Remove /home/project from buildPath if it exists
      const buildPath = buildOutput.path.replace(WORK_DIR, "");

      // Check if the build path exists
      let finalBuildPath = buildPath;

      // List of common output directories to check if the specified build path doesn't exist
      const commonOutputDirs = [
        buildPath,
        "/dist",
        "/build",
        "/out",
        "/output",
        "/.next",
        "/public",
      ];

      // Verify the build path exists, or try to find an alternative
      let buildPathExists = false;

      for (const dir of commonOutputDirs) {
        try {
          await container.fs.readdir(dir);
          finalBuildPath = dir;
          buildPathExists = true;
          console.log(`Using build directory: ${finalBuildPath}`);
          break;
        } catch (error) {
          // Directory doesn't exist, try the next one
          console.log(
            `Directory ${dir} doesn't exist, trying next option. ${error}`,
          );
          continue;
        }
      }

      if (!buildPathExists) {
        throw new Error(
          "Could not find build output directory. Please check your build configuration.",
        );
      }

      const fileContents = await getAllFiles(
        finalBuildPath,
        finalBuildPath,
        container,
      );

      // Platform-specific deployment
      const storageKey = `${platform}-site-${currentProjectId}`;
      const existingSiteId = localStorage.getItem(storageKey);

      const apiEndpoint =
        platform === "netlify"
          ? `${API_URL}/api/netlify-deploy`
          : `${API_URL}/api/vercel-deploy`;

      // Deploy using the API route with file contents
      const response = await customFetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: existingSiteId || undefined,
          files: fileContents,
          token,
          chatId: currentProjectId,
        }),
      });

      const data = await response.json();

      // Handle platform-specific response validation
      if (
        platform === "netlify" &&
        (!response.ok || !data.deploy || !data.site)
      ) {
        console.error("Invalid deploy response:", data);
        throw new Error(data.error || "Invalid deployment response");
      } else if (
        platform === "vercel" &&
        (!response.ok || !data.deploy || !data.project)
      ) {
        console.error("Invalid deploy response:", data);
        throw new Error(data.error || "Invalid deployment response");
      }

      // Handle Netlify-specific status polling
      let deployUrl = "";
      if (platform === "netlify") {
        // Store the site ID if it's a new site
        if (data.site) {
          localStorage.setItem(storageKey, data.site.id);
        }

        // Poll for deployment status
        const maxAttempts = 20; // 2 minutes timeout
        let attempts = 0;
        let deploymentStatus;

        while (attempts < maxAttempts) {
          try {
            const statusResponse = await fetch(
              `https://api.netlify.com/api/v1/sites/${data.site.id}/deploys/${data.deploy.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            deploymentStatus = await statusResponse.json();

            if (
              deploymentStatus.state === "ready" ||
              deploymentStatus.state === "uploaded"
            ) {
              break;
            }

            if (deploymentStatus.state === "error") {
              throw new Error(
                "Deployment failed: " +
                  (deploymentStatus.error_message || "Unknown error"),
              );
            }

            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error("Status check error:", error);
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (attempts >= maxAttempts) {
          throw new Error("Deployment timed out");
        }

        deployUrl = deploymentStatus.ssl_url || deploymentStatus.url;
      } else {
        // Handle Vercel response
        if (data.project) {
          localStorage.setItem(storageKey, data.project.id);
        }
        deployUrl = data.deploy.url;
      }

      // Update the message with the deployment URL
      upsertMessage({
        ...initialDeploymentMsg,
        content: JSON.stringify({
          artifact: {
            ...artifact,
            endingContext:
              endingContext +
              "\n\n" +
              `Here is the deployed site URL:
                <a
                  href=${deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style="color: #0070f3;"
                >
                  ${deployUrl}
                </a>`,
          },
        }),
      });
    } catch (error) {
      updateActionStatus(messageId, 0, "error");
      console.error(`${platform} deploy error:`, error);
      toast.error(`${platformName} deployment failed`);
    } finally {
      setDeployingTo(null);
    }
  };

  return {
    deployingTo,
    hasNetlifyToken: !!validatedNetlifyToken,
    hasVercelToken: !!validatedVercelToken,
    handleDeploy,
  };
}
