import { GoogleGenerativeAI } from "@google/generative-ai";
import { chatSchema, promptSchema } from "@repo/common/zod";
import prisma from "@repo/db/client";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { modelConfig, PORT } from "./constants";
import { sseMiddleware } from "./middlewares/sseMiddleware";
import { parseXML } from "./utils/parseXML";
import { getSystemPrompt, getUIPrompt } from "./prompts/systemPrompt";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.post("/api/new", async (req, res) => {
  const validation = promptSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message,
    });
    return;
  }
  const { prompt } = validation.data;
  try {
    const newProject = await prisma.project.create({
      data: {
        name: prompt,
        createdAt: new Date(),
        status: "NEW",
        userId: "cm59k02420000ff6m7t1a7ret"
      },
    });
    res.json({
      projectId: newProject.id,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Failed to create new project",
    });
  }
});

app.get("/api/template/:projectId", async (req, res) => {
  const model = genAI.getGenerativeModel(modelConfig);
  const { projectId } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });
    if (!project) {
      throw new Error("Project not found");
    }
    // IN_PROGRESS projects have already generated template
    if (project.status === "IN_PROGRESS") {
      const existingTemplate = await prisma.file.findMany({
        where: {
          projectId: project.id,
        }
      });
      if (existingTemplate.length === 0) throw new Error("Template not found");
      res.json({
        projectId: project.id,
        title: project.name,
        template: existingTemplate,
        uiPrompt: getUIPrompt(),
      });
      return;
    }
    // Now handle content generation and send it via SSE
    const result = await model.generateContentStream(
      templateInitPrompt(project.name)
    );
    let streamContent = "";

    // Process the stream chunks
    for await (const chunk of result.stream) {
      const chunkText = chunk.text ? chunk.text() : chunk; // Ensure `chunk.text()` exists
      streamContent += chunkText; // Append chunk to result
    }
    const template = parseXML(streamContent);
    // Save the generated template to the database
    const createdTemplate = await prisma.file.createMany({
      data: template.files.map(file => ({
        projectId: project.id,
        path: file.path,
        content: file.content
      }))
    });
    // Update project status to IN_PROGRESS
    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        name: template.title,
        status: "IN_PROGRESS",
      },
    });
    res.json({
      projectId: project.id,
      title: template.title,
      template: createdTemplate,
      uiPrompt: getUIPrompt(),
    });
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error ? error.message : "Failed to generate template",
    });
  }
});

app.post("/api/chat", sseMiddleware, async (req, res) => {
  const validation = chatSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message,
    });
    return;
  }
  const { messages } = validation.data;
  const model = genAI.getGenerativeModel({
    ...modelConfig,
    systemInstruction: getSystemPrompt(),
  });
  try {
    const result = await model.generateContentStream({
      contents: messages,
    });
    for await (const chunk of result.stream) {
      const chunkText = chunk.text ? chunk.text() : chunk; // Ensure `chunk.text()` exists
      res.write(`data: ${chunkText}\n\n`);
    }
    res.end();
  } catch (error) {
    res.write(
      `data: ${JSON.stringify({ error: "Failed to process chat" })}\n\n`
    );
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
