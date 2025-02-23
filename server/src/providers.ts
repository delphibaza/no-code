import { google } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import {
    extractReasoningMiddleware,
    wrapLanguageModel
} from 'ai';

const openaiOVH = createOpenAI({
    baseURL: "https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1",
    apiKey: process.env.OVH_API_KEY,
});

const openaiOpenRouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

export const openaiGROQ = createGroq({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

const openaiTargon = createOpenAI({
    baseURL: 'https://api.targon.com/v1',
    apiKey: process.env.TARGON_API_KEY,
});

export const google2FlashModel = google('gemini-2.0-flash-001');
const queenVLPlusModel = openaiOpenRouter('qwen/qwen-vl-plus:free');
export const selectorModel = openaiGROQ('qwen-2.5-coder-32b');

const ovhR1Model = openaiOVH('DeepSeek-R1-Distill-Llama-70B');
const targonR1Model = openaiTargon('deepseek-ai/DeepSeek-R1-Distill-Llama-70B');

const coderModel = wrapLanguageModel({
    model: ovhR1Model,
    middleware: extractReasoningMiddleware({ tagName: 'think' }),
});