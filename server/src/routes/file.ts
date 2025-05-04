import { saveFileSchema } from "@repo/common/zod";
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
      msg: error instanceof Error ? error.message : "Failed to save files",
    });
  }
});

export default router;
