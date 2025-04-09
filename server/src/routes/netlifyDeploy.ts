import express, { Request, Response } from "express";
import { validateProjectOwnership } from "../services/projectService";

export interface DeployRequestBody {
  siteId?: string;
  files: Record<string, string>;
  chatId: string;
}
export interface SiteInfo {
  id: string;
  name: string;
  url: string;
  chatId: string;
}

async function sha1(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}
const router = express.Router();

router.post("/netlify-deploy", async (req: Request, res: Response) => {
  try {
    const { siteId, files, token, chatId } = req.body as DeployRequestBody & {
      token: string;
    };
    // Validate project ownership
    await validateProjectOwnership(chatId, req.auth.userId!);

    if (!token) {
      res.status(401).json({ error: "Not connected to Netlify" });
      return;
    }

    if (!files || Object.keys(files).length === 0) {
      res.status(400).json({ error: "No files provided" });
      return;
    }

    let targetSiteId = siteId;
    let siteInfo: SiteInfo | undefined;

    // If no siteId provided, create a new site
    if (!targetSiteId) {
      const siteName = `no-code-${chatId}-${Date.now()}`;
      const createSiteResponse = await fetch(
        "https://api.netlify.com/api/v1/sites",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: siteName,
            custom_domain: null,
          }),
        }
      );

      if (!createSiteResponse.ok) {
        res.status(400).json({ error: "Failed to create site" });
        return;
      }

      const newSite = (await createSiteResponse.json()) as any;
      targetSiteId = newSite.id;
      siteInfo = {
        id: newSite.id,
        name: newSite.name,
        url: newSite.url,
        chatId,
      };
    } else {
      // Get existing site info, this will only run if a siteId is provided from the client
      if (targetSiteId) {
        const siteResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${targetSiteId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (siteResponse.ok) {
          const existingSite = (await siteResponse.json()) as any;
          siteInfo = {
            id: existingSite.id,
            name: existingSite.name,
            url: existingSite.url,
            chatId,
          };
        } else {
          targetSiteId = undefined;
        }
      }

      // If no siteId provided or site doesn't exist, create a new site
      if (!targetSiteId) {
        const siteName = `no-code-${chatId}-${Date.now()}`;
        const createSiteResponse = await fetch(
          "https://api.netlify.com/api/v1/sites",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: siteName,
              custom_domain: null,
            }),
          }
        );

        if (!createSiteResponse.ok) {
          res.status(400).json({ error: "Failed to create site" });
          return;
        }

        const newSite = (await createSiteResponse.json()) as any;
        targetSiteId = newSite.id;
        siteInfo = {
          id: newSite.id,
          name: newSite.name,
          url: newSite.url,
          chatId,
        };
      }
    }

    // Create file digests
    const fileDigests: Record<string, string> = {};

    for (const [filePath, content] of Object.entries(files)) {
      // Ensure file path starts with a forward slash
      const normalizedPath = filePath.startsWith("/")
        ? filePath
        : "/" + filePath;
      const hash = await sha1(content);
      fileDigests[normalizedPath] = hash;
    }

    // Create a new deploy with digests
    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileDigests,
          async: true,
          skip_processing: false,
          draft: false, // Change this to false for production deployments
          function_schedules: [],
          required: Object.keys(fileDigests), // Add this line
          framework: null,
        }),
      }
    );

    if (!deployResponse.ok) {
      res.status(400).json({ error: "Failed to create deployment" });
      return;
    }

    const deploy = (await deployResponse.json()) as any;
    let retryCount = 0;
    const maxRetries = 60;

    // Poll until deploy is ready for file uploads
    while (retryCount < maxRetries) {
      const statusResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys/${deploy.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const status = (await statusResponse.json()) as any;

      if (status.state === "prepared" || status.state === "uploaded") {
        // Upload all files regardless of required array
        for (const [filePath, content] of Object.entries(files)) {
          const normalizedPath = filePath.startsWith("/")
            ? filePath
            : "/" + filePath;

          let uploadSuccess = false;
          let uploadRetries = 0;

          // Retry upload up to 3 times
          while (!uploadSuccess && uploadRetries < 3) {
            try {
              const uploadResponse = await fetch(
                `https://api.netlify.com/api/v1/deploys/${deploy.id}/files${normalizedPath}`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/octet-stream",
                  },
                  body: content,
                }
              );

              uploadSuccess = uploadResponse.ok;

              if (!uploadSuccess) {
                console.error("Upload failed:", await uploadResponse.text());
                uploadRetries++;
                await new Promise((resolve) => setTimeout(resolve, 2000));
              }
            } catch (error) {
              console.error("Upload error:", error);
              uploadRetries++;
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }

          if (!uploadSuccess) {
            res
              .status(500)
              .json({ error: `Failed to upload file ${filePath}` });
            return;
          }
        }
      }
      // Indicates that files are uploaded
      if (status.state === "ready") {
        // Only return after files are uploaded
        if (
          Object.keys(files).length === 0 ||
          status.summary?.status === "ready"
        ) {
          res.json({
            success: true,
            deploy: {
              id: status.id,
              state: status.state,
              url: status.ssl_url || status.url,
            },
            site: siteInfo,
          });
          return;
        }
      }

      if (status.state === "error") {
        res.status(500).json({
          error: status.error_message || "Deploy preparation failed",
        });
        return;
      }

      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (retryCount >= maxRetries) {
      res.status(500).json({ error: "Deploy preparation timed out" });
      return;
    }

    // Make sure we're returning the deploy ID and site info
    res.json({
      success: true,
      deploy: {
        id: deploy.id,
        state: deploy.state,
      },
      site: siteInfo,
    });
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error ? error.message : "Failed to deploy to Netlify",
    });
  }
});

export default router;
