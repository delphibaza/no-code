import { z } from "zod";

export const promptSchema = z.object({
  prompt: z.string().min(1, "Please provide some prompt"),
  templateName: z.string().optional(),
});
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number().optional(),
  rawContent: z.string().optional(),
});
export const chatSchema = z.object({
  projectId: z.string(),
  reasoning: z.boolean(),
  messages: z.array(messageSchema),
});
export const saveFileSchema = z.object({
  projectId: z.string(),
  files: z.array(
    z.object({
      filePath: z.string(),
      content: z.string(),
    })
  ),
});
export const renameFileSchema = z.object({
  projectId: z.string(),
  files: z.array(
    z.object({
      oldPath: z.string(),
      newPath: z.string(),
    })
  ),
});
export type PromptSchema = z.infer<typeof promptSchema>;
