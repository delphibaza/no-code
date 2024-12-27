import { z } from "zod";

export const promptSchema = z.object({
    prompt: z.string().min(3, "Please provide some prompt")
});
export const chatSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(["user", "model"]),
        parts: z.array(z.object({ text: z.string() }))
    }))
});
