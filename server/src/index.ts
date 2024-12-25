import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai"
import { MAX_TOKENS, PORT } from "./constants";
import { templateInitPrompt } from "./prompts/templateInitPrompt";
import { promptSchema } from "@repo/zod/schema";
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
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      candidateCount: 1,
      maxOutputTokens: MAX_TOKENS,
    },
  });
  try {
    const result = await model.generateContentStream(templateInitPrompt(prompt));
    let streamContent = "";
    // Process the stream chunks
    for await (const chunk of result.stream) {
      const chunkText = chunk.text ? chunk.text() : chunk; // Ensure `chunk.text()` exists
      streamContent += chunkText; // Append chunk to result
    }
    // Send the aggregated content as the response
    res.json({
      data: streamContent
    });
  } catch (error) {
    console.error("Error processing stream:", error);
    res.status(500).json({ error: "Failed to process stream" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});