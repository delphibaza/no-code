import { createOpenAI } from '@ai-sdk/openai';
import { chatSchema, promptSchema } from "@repo/common/zod";
import prisma from "@repo/db/client";
import { generateText, pipeDataStreamToResponse, smoothStream, streamText } from 'ai';
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MAX_TOKENS, STARTER_TEMPLATES } from "./constants";
import { enhancerPrompt } from "./prompts/enhancerPrompt";
import { getTemplates, parseSelectedTemplate, starterTemplateSelectionPrompt } from "./prompts/starterTemplateSelection";
import { getSystemPrompt } from "./prompts/systemPrompt";
import { reactViteTemplate } from './cache/bolt-vite-react';
dotenv.config();

const openaiHF = createOpenAI({
  baseURL: "https://api-inference.huggingface.co/v1",
  apiKey: process.env.HF_API_KEY
});
const openai = createOpenAI({
  baseURL: "https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1"
});
const coderModel = openai('DeepSeek-R1-Distill-Llama-70B');
const qwenModel = openaiHF('Qwen/Qwen2.5-Coder-32B-Instruct');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/new', async (req, res) => {
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
        status: "NEW",
        userId: "cm59k02420000ff6m7t1a7ret"
      }
    });
    res.json({
      projectId: newProject.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: error instanceof Error ? error.message : "Failed to create project",
    });
  }
});

app.get('/api/template/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      }
    });
    if (!project) {
      throw new Error("Project not found");
    }
    const { name: prompt } = project;
    // Enhance the prompt
    const { text: enhancedPrompt } = await generateText({
      model: qwenModel,
      system: enhancerPrompt(),
      prompt: prompt
    });

    // Select the template
    const { text: templateXML } = await generateText({
      model: qwenModel,
      system: starterTemplateSelectionPrompt(STARTER_TEMPLATES),
      prompt: enhancedPrompt
    });

    const templateName = parseSelectedTemplate(templateXML);
    if (!templateName) {
      // Indicates that LLM hasn't generated any template name. It doesn't happen mostly. 
      throw new Error("Error occurred while identifying a template");
    }
    if (templateName === 'bolt-vite-react') {
      // If the template is bolt-vite-react, then we need to fetch the template files and prompt
      const { templateFiles, templatePrompt } = reactViteTemplate;
      res.json({
        enhancedPrompt,
        templateFiles,
        templatePrompt
      });
      return;
    } else if (templateName !== "blank") {
      const temResp = await getTemplates(templateName);
      if (temResp) {
        const { templateFiles, templatePrompt } = temResp;
        res.json({
          enhancedPrompt,
          templateFiles,
          templatePrompt
        });
        return;
      }
    } else {
      res.json({
        enhancedPrompt
      });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: error instanceof Error ? error.message : "Failed to generate template",
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const validation = chatSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message,
    });
    return;
  }
  const { messages } = validation.data;
  pipeDataStreamToResponse(res, {
    execute: async dataStreamWriter => {
      const result = streamText({
        model: coderModel,
        system: getSystemPrompt(),
        messages: messages,
        experimental_transform: smoothStream(),
        maxTokens: MAX_TOKENS,
        providerOptions: {
          openai: {
            reasoningEffort: 'low',
          }
        },
        // onFinish({ text, finishReason, usage, response, reasoning }) {
        // your own logic, e.g. for saving the chat history or recording usage
        // const messages = response.messages; // messages that were generated
      });
      result.mergeIntoDataStream(dataStreamWriter, {
        sendReasoning: true,
        sendUsage: true,
      });
    },
    onError: error => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error);
    },
  })
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
