import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai"
import { modelConfig, PORT } from "./constants";
import { templateInitPrompt } from "./prompts/templateInitPrompt";
import { chatSchema, promptSchema } from "@repo/common/zod";
import { parseXML } from "./parseXML";
import cors from "cors";
import { getSystemPrompt, getUIPrompt } from "./prompts/systemPrompt";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.post("/api/template", async (req, res) => {
  const validation = promptSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message
    });
    return;
  }
  const { prompt } = validation.data;
  const model = genAI.getGenerativeModel(modelConfig);
  try {
    const result = await model.generateContentStream(templateInitPrompt(prompt));
    let streamContent = "";
    // Process the stream chunks
    for await (const chunk of result.stream) {
      const chunkText = chunk.text ? chunk.text() : chunk; // Ensure `chunk.text()` exists
      streamContent += chunkText; // Append chunk to result
    }
    // Send the parsed template as the response
    res.json({
      template: parseXML(streamContent),
      uiPrompt: getUIPrompt()
    });
  } catch (error) {
    res.status(500).json({
      msg: error instanceof Error ? error.message : "Failed to generate template"
    });
  }
});

app.post("/api/chat", async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const validation = chatSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message
    });
    return;
  }
  const { messages } = validation.data;
  const model = genAI.getGenerativeModel({
    ...modelConfig,
    systemInstruction: getSystemPrompt()
  });
  try {
    const result = await model.generateContentStream({
      contents: messages
    });
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${chunkText}\n\n`);
    }
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: "Failed to process chat" })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});