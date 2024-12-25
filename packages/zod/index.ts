import { z } from "zod";

export const promptSchema = z.object({
    prompt: z.string().min(3, "Please provide some prompt")
});