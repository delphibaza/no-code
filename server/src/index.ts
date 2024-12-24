import express from "express"
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai"
import { MAX_TOKENS, PORT } from "./constants";
import { getSystemPrompt } from "./prompts";
dotenv.config();

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    candidateCount: 1,
    maxOutputTokens: MAX_TOKENS,
  },
  systemInstruction: getSystemPrompt()
});

app.post("/", async (req, res): Promise<any> => {
  const prompt = req.body.prompt;

  const result = await model.generateContentStream(prompt);
  // Print text as it comes in.
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    console.log(chunkText);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});