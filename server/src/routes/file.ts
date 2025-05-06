import { renameFileSchema, saveFileSchema } from "@repo/common/zod";
import prisma from "@repo/db/client";
import express, { Request, Response } from "express";
import { validateProjectOwnership } from "../services/projectService";
import { ApplicationError } from "../utils/timeHelpers";

const router = express.Router();
// Owner can only save files
router.post("/saveFiles", async (req: Request, res: Response) => {
  const validation = saveFileSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message,
    });
    return;
  }
  if (!req.auth.userId) {
    res.status(401).json({
      msg: "Unauthorized",
    });
    return;
  }
  const { projectId, files } = validation.data;
  try {
    await validateProjectOwnership(projectId, req.auth.userId);
    await prisma.$transaction(
      files.map((file) =>
        prisma.file.upsert({
          where: {
            projectId_filePath: {
              projectId,
              filePath: file.filePath,
            },
          },
          update: {
            content: file.content,
            timestamp: new Date(),
          },
          create: {
            projectId,
            filePath: file.filePath,
            content: file.content,
          },
        })
      )
    );
    res.status(201).json({
      msg: "File saved successfully",
    });
  } catch (error) {
    if (error instanceof ApplicationError) {
      res.status(error.code).json({ msg: error.message });
      return;
    }
    console.log("Failed to save files:", error);

    res.status(500).json({
      msg: "Failed to save files",
    });
  }
});

// Owner can only delete files
router.delete("/deleteFiles", async (req: Request, res: Response) => {
  // Use query params to get projectId and paths instead of request body for delete request
  const { projectId, paths } = req.query as {
    projectId: string;
    paths: string | string[];
  };
  if (!projectId || !paths) {
    res.status(400).json({
      msg: "Project ID and paths are required",
    });
    return;
  }
  if (!req.auth.userId) {
    res.status(401).json({
      msg: "Unauthorized",
    });
    return;
  }
  const pathsArray = Array.isArray(paths) ? paths : [paths];
  try {
    await validateProjectOwnership(projectId, req.auth.userId);
    await prisma.$transaction(
      pathsArray.map((path) =>
        prisma.file.delete({
          where: {
            projectId_filePath: {
              projectId,
              filePath: path,
            },
          },
        })
      )
    );
    res.status(204).send();
  } catch (error) {
    if (error instanceof ApplicationError) {
      res.status(error.code).json({ msg: error.message });
      return;
    }
    console.log("Failed to delete files:", error);

    res.status(500).json({
      msg: "Failed to delete files",
    });
  }
});

// Owner can only rename files
router.patch("/renameFiles", async (req: Request, res: Response) => {
  const validation = renameFileSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message,
    });
    return;
  }
  if (!req.auth.userId) {
    res.status(401).json({
      msg: "Unauthorized",
    });
    return;
  }
  const { projectId, files } = validation.data;
  try {
    await validateProjectOwnership(projectId, req.auth.userId);
    await prisma.$transaction(
      files.map((file) =>
        prisma.file.update({
          where: {
            projectId_filePath: {
              projectId,
              filePath: file.oldPath,
            },
          },
          data: {
            filePath: file.newPath,
          },
        })
      )
    );
    res.status(204).send();
  } catch (error) {
    if (error instanceof ApplicationError) {
      res.status(error.code).json({ msg: error.message });
      return;
    }
    console.log("Failed to rename files:", error);

    res.status(500).json({
      msg: "Failed to rename files",
    });
  }
});

export default router;
