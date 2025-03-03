import { Template } from "@repo/common/types";
import prisma from "@repo/db/client";
import { generateText } from "ai";
import { promises as fs } from 'fs';
import path from 'path';
import { STARTER_TEMPLATES } from "../constants";
import { enhancerPrompt } from "../prompts/enhancerPrompt";
import { getTemplates, parseSelectedTemplate, starterTemplateSelectionPrompt } from "../prompts/starterTemplateSelection";
import { selectorModel } from "../providers";
import { ApplicationError } from "../utils";

export const createProject = async (name: string, userId: string) => {
    return await prisma.project.create({
        data: {
            name,
            createdAt: new Date(),
            userId: userId,
            state: 'new',
            messages: {
                create: {
                    role: 'user',
                    content: { text: name.slice(0, 25) }
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
                    timestamp: true,
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
                    createdAt: true,
                    tokensUsed: true,
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

/**
* Creates project files from template files
* 
* @param {string} projectId - Project identifier
* @param {Array} templateFiles - Array of template file objects
* @returns {Promise<void>}
*/
export async function createProjectFiles(projectId: string, templateFiles: Template['templateFiles']) {
    await prisma.file.createMany({
        data: templateFiles.map(file => ({
            projectId,
            filePath: file.filePath,
            content: file.content
        }))
    });
}

/**
 * Selects an appropriate template based on the enhanced prompt
 * 
 * @param {string} enhancedPrompt - The enhanced project description
 * @returns {Promise<Object>} Selected template info and token usage
 */
export async function selectTemplate(enhancedPrompt: string) {
    const { text: templateXML, finishReason, usage } = await generateText({
        model: selectorModel,
        system: starterTemplateSelectionPrompt(STARTER_TEMPLATES),
        prompt: enhancedPrompt
    });

    // Then in your error handling:
    if (finishReason !== 'stop') {
        throw new ApplicationError("Error occurred while creating the project", 'TEMPLATE_ERROR');
    }

    const { templateName, projectTitle } = parseSelectedTemplate(templateXML);

    if (!templateName) {
        throw new ApplicationError("Error occurred while identifying a template", 'TEMPLATE_ERROR');
    }

    return { templateName, projectTitle, usage };
}

/**
* Enhances the project prompt using the selector model
* 
* @param {string} projectName - Original project name/prompt
* @returns {Promise<Object>} Enhanced prompt and token usage
*/
export async function enhanceProjectPrompt(projectName: string) {
    const { text, finishReason, usage } = await generateText({
        model: selectorModel,
        system: enhancerPrompt(),
        prompt: projectName
    });
    // We don't want to charge the user for a partial response
    if (finishReason !== 'stop') {
        console.log({ finishReason, usage });
        throw new ApplicationError("Error occurred while creating the project", 'TEMPLATE_ERROR');
    }

    return { enhancedPrompt: text, usage };
}