import { saveFileSchema } from '@repo/common/zod';
import prisma from '@repo/db/client';
import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/saveFiles', async (req: Request, res: Response) => {
    const validation = saveFileSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({
            msg: validation.error.errors[0].message,
        });
        return;
    }
    const { projectId, files } = validation.data;
    try {
        await prisma.$transaction(
            files.map(file =>
                prisma.file.upsert({
                    where: {
                        projectId_filePath: {
                            projectId,
                            filePath: file.filePath
                        }
                    },
                    update: {
                        content: file.content,
                        timestamp: new Date()
                    },
                    create: {
                        projectId,
                        filePath: file.filePath,
                        content: file.content
                    }
                })
            )
        );
        res.status(200).json({
            msg: "Files saved",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Failed to save files",
        });
    }
})


export default router;