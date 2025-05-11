import { Artifact } from "@repo/common/types";
import { chatSchema, promptSchema } from "@repo/common/zod";
import prisma from "@repo/db/client";
import { pipeDataStreamToResponse, smoothStream, streamText } from "ai";
import { parse } from "best-effort-json-parser";
import express from "express";
import { ensureUserExists } from "../middleware/ensureUser";
import { resetLimits } from "../middleware/resetLimits";
import { getSystemPrompt } from "../prompts/systemPrompt";
import { coderModel, reasoningModel } from "../providers";
import {
  enhanceProjectPrompt,
  validateProjectOwnership,
} from "../services/projectService";
import {
  checkLimits,
  updateSubscription,
} from "../services/subscriptionService";
import { ApplicationError, getDaysBetweenDates } from "../utils/timeHelpers";

const router = express.Router();

router.post("/chat", ensureUserExists, resetLimits, async (req, res) => {
  const validation = chatSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message,
    });
    return;
  }
  if (!req.plan) {
    res.status(403).json({ msg: "Unable to get token limits for the user" });
    return;
  }
  const { messages, projectId, reasoning } = validation.data;
  try {
    // Validate ownership
    await validateProjectOwnership(projectId, req.auth.userId!);
    // Check the limits
    const limitsCheck = checkLimits(req.plan);

    if (!limitsCheck.success) {
      throw new ApplicationError(
        limitsCheck.message ?? "You have reached your token limit",
        403
      );
    }
    pipeDataStreamToResponse(res, {
      execute: async (dataStreamWriter) => {
        // dataStreamWriter.writeData('initialized call');
        const result = streamText({
          model: reasoning ? reasoningModel : coderModel,
          system: getSystemPrompt(),
          messages: messages,
          experimental_continueSteps: true,
          experimental_transform: smoothStream(),
          maxTokens: 8000,
          maxSteps: 25,
          async onStepFinish({ finishReason, usage }) {
            console.log({ finishReason });
            req.plan!.dailyTokensUsed += usage.totalTokens || 0;
            req.plan!.monthlyTokensUsed += usage.totalTokens || 0;
            // Check the limits
            const limitsCheck = checkLimits(req.plan!);
            if (!limitsCheck.success) {
              throw new ApplicationError(
                limitsCheck.message ?? "You have reached your token limit",
                403
              );
            }
            await updateSubscription(req.plan!);
          },
          async onFinish({ text, finishReason, usage, response, reasoning }) {
            try {
              let jsonContent;
              // Check if text is wrapped in markdown code blocks
              const jsonMatch = text.match(/```json\n([\s\S]*?)```/);
              if (jsonMatch && jsonMatch[1]) {
                // Extract JSON from markdown code blocks
                jsonContent = parse(jsonMatch[1]);
              } else {
                // Try parsing the text directly as JSON
                jsonContent = parse(text);
              }

              const currentMessage = messages.find(
                (message) =>
                  message.role === "user" && message.id === "currentMessage"
              );
              await prisma.message.createMany({
                data: [
                  ...(currentMessage
                    ? [
                        {
                          role: "user" as const,
                          projectId: projectId,
                          createdAt: currentMessage.timestamp
                            ? new Date(currentMessage.timestamp)
                            : new Date(),
                          // Wrap in object to make it valid JSON
                          content: { text: currentMessage.rawContent || "" },
                        },
                      ]
                    : []),
                  {
                    role: "assistant" as const,
                    projectId: projectId,
                    createdAt: new Date(),
                    tokensUsed:
                      usage.totalTokens ||
                      usage.promptTokens ||
                      usage.completionTokens ||
                      0,
                    content: jsonContent,
                  },
                ],
              });

              // Safely access artifact and actions with proper validation
              if (!jsonContent?.artifact) {
                return; // Skip file processing if artifact is missing
              }

              const { actions } = jsonContent.artifact as Artifact;

              if (!Array.isArray(actions)) {
                return; // Skip file processing if actions is not an array
              }

              const files = actions.filter((action) => action.type === "file");

              files.forEach(async (file) => {
                await prisma.file.upsert({
                  where: {
                    // Unique identifier to find the record
                    projectId_filePath: {
                      projectId: projectId,
                      filePath: file.filePath,
                    },
                  },
                  update: {
                    // Update these fields if record exists
                    content: file.content,
                    timestamp: new Date(),
                  },
                  create: {
                    // Create new record with these fields if not found
                    projectId: projectId,
                    filePath: file.filePath,
                    content: file.content,
                    timestamp: new Date(),
                  },
                });
              });

              await prisma.project.update({
                where: { id: projectId },
                data: {
                  state: "existing",
                },
              });
            } catch (error) {
              console.log("Failed to parse JSON or saving messages", error);
            }
          },
        });
        result.mergeIntoDataStream(dataStreamWriter, {
          sendReasoning: reasoning,
          sendUsage: true,
        });
      },
      onError: (error) => {
        // Error messages are masked by default for security reasons.
        // If you want to expose the error message to the client, you can do so here:
        console.log(error);
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (error) {
    console.log(error);
    if (error instanceof ApplicationError) {
      res.status(error.code).json({ msg: error.message });
      return;
    }
    res.status(500).json({
      msg: error instanceof Error ? error.message : "Failed to generate chat",
    });
  }
});

router.post("/enhance-prompt", async (req, res) => {
  const validation = promptSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      msg: validation.error.errors[0].message,
    });
    return;
  }
  if (!req.auth.userId) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }
  try {
    const { prompt } = validation.data;
    const { enhancedPrompt } = await enhanceProjectPrompt(prompt);
    res.json({
      enhancedPrompt: enhancedPrompt,
    });
  } catch (error) {
    res.status(500).json({
      msg: error instanceof Error ? error.message : "Failed to enhance prompt",
    });
  }
});

router.get("/subscription", resetLimits, async (req, res) => {
  if (!req.plan) {
    res.status(403).json({ msg: "Unable to get token limits for the user" });
    return;
  }
  const {
    dailyTokensUsed,
    dailyTokenLimit,
    monthlyTokensUsed,
    monthlyTokenLimit,
    endDate,
    planType,
    startDate,
  } = req.plan;
  // Calculate peak usage
  const peakUsage = Math.max(dailyTokensUsed, monthlyTokensUsed);
  // Calculate daily average
  const totalDaysElapsed = getDaysBetweenDates(startDate, new Date());
  const dailyAverage =
    totalDaysElapsed > 0 ? monthlyTokensUsed / totalDaysElapsed : 0;

  res.json({
    plan: planType,
    startDate: startDate,
    endDate: endDate,
    tokenUsage: {
      daily: {
        used: dailyTokensUsed,
        limit: dailyTokenLimit,
        percentage: (dailyTokensUsed / dailyTokenLimit) * 100,
      },
      monthly: {
        used: monthlyTokensUsed,
        limit: monthlyTokenLimit,
        percentage: (monthlyTokensUsed / monthlyTokenLimit) * 100,
      },
    },
    peakUsage: peakUsage,
    dailyAverage: dailyAverage,
  });
});

export default router;
