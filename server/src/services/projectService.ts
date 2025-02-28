import { Template } from "@repo/common/types";
import prisma from "@repo/db/client";
import { promises as fs } from 'fs';
import path from 'path';
import { getTemplates } from "../prompts/starterTemplateSelection";

export const createProject = async (name: string, userId: string) => {
    return await prisma.project.create({
        data: {
            name,
            createdAt: new Date(),
            userId: userId,
            messages: {
                create: {
                    role: 'user',
                    content: { text: name }
                }
            },
        }
    });
};

export const getProject = async (projectId: string) => {
    return await prisma.project.findUnique({
        where: {
            id: projectId
        },
        include: {
            files: {
                select: {
                    id: true,
                    filePath: true,
                    content: true,
                    timestamp: true
                }
            },
            messages: {
                orderBy: {
                    createdAt: 'asc'
                },
                select: {
                    id: true,
                    role: true,
                    content: true,
                    createdAt: true
                }
            }
        }
    });
};

export const getTemplateData = async (templateName: string): Promise<Template> => {
    const templatePath = path.join(__dirname, 'cache', `${templateName}.json`);

    try {
        // Try to read from cache first
        await fs.access(templatePath);
        const data = await fs.readFile(templatePath, 'utf8');
        return JSON.parse(data);
    } catch {
        // If cache read fails, fetch from GitHub
        const temResp = await getTemplates(templateName);
        if (!temResp) {
            throw new Error("Unable to initialize the project. Please try again with a different prompt.");
        }
        return temResp;
    }
};

export async function validateProjectOwnership(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
    });

    if (!project) {
        throw new Error("Project not found");
    }

    if (project.userId !== userId) {
        throw new Error("You are not allowed to access this project");
    }

    return project;
}