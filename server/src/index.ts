import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai"
import { modelConfig, PORT } from "./constants";
import { templateInitPrompt } from "./prompts/templateInitPrompt";
import { chatSchema, promptSchema } from "@repo/zod/schema";
import { parseXML } from "./parseXML";
import { getSystemPrompt, getUIPrompt } from "./prompts/systemPrompt";
dotenv.config();

const app = express();
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
    const errorMessage = error instanceof Error ? error.message : "Failed to generate template";
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/chat", async (req, res) => {
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
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello" }],
        },
        {
          role: "model",
          parts: [{ text: "Great to meet you. What would you like to know?" }],
        },
      ],
    });
    let result = await chat.sendMessageStream("I have 2 dogs in my house.");
    let streamContent = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      streamContent += chunkText; // Append chunk to result
    }

  } catch (error) {
    res.status(500).json({ error: "Failed to process chat" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});