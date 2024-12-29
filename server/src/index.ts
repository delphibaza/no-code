import { GoogleGenerativeAI } from "@google/generative-ai";
import { chatSchema, promptSchema } from "@repo/common/zod";
import prisma from "@repo/db/client";
import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { modelConfig, PORT } from "./constants";
import { parseXML } from "./parseXML";
import { getSystemPrompt, getUIPrompt } from "./prompts/systemPrompt";
import { templateInitPrompt } from "./prompts/templateInitPrompt";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yvieqjqbspmtoabaozog.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aWVxanFic3BtdG9hYmFvem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4Njg2NTEsImV4cCI6MjA1MDQ0NDY1MX0.Qs0P1Gj0UeLcuODk3HZ0BaftDeelU96zYdxQNx1hFC8"
);

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const sseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  next();
};

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
    res.json({
      template: parseXML(streamContent),
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

const validateToken = async (
  req: Request,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Authorization token is required" });
      return;
    }

    const { data: user, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    req.body.user = user;
    next(); // Call next() to pass control to the next middleware or route handler
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Route to validate user session
app.get("/api/user", validateToken, (req: Request, res: Response) => {
  res.status(200).json({ user: req.body.user });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
