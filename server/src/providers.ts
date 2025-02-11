import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import {
    extractReasoningMiddleware,
    wrapLanguageModel
} from 'ai';

const openaiOVH = createOpenAI({
    baseURL: "https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1",
    apiKey: process.env.OVH_API_KEY,
});

const openaiChutes = createOpenAI({
    baseURL: 'https://chutes-qwen-qwen2-5-72b-instruct.chutes.ai/v1',
    apiKey: process.env.CHUTES_API_KEY,
});

const openaiChutes2 = createOpenAI({
    baseURL: 'https://chutes-deepseek-ai-deepseek-r1-distill-llama-70b.chutes.ai/v1',
    apiKey: process.env.CHUTES_API_KEY,
});

const openaiChutes3 = createOpenAI({
    baseURL: 'https://chutes-unsloth-mistral-nemo-instruct-2407.chutes.ai/v1',
    apiKey: process.env.CHUTES_API_KEY,
});

const openaiOpenRouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

const openaiGROQ = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

const openaiTargon = createOpenAI({
    baseURL: 'https://api.targon.com/v1',
    apiKey: process.env.TARGON_API_KEY,
});

export const google2FlashModel = google('gemini-2.0-flash-001');
const queenVLPlusModel = openaiOpenRouter('qwen/qwen-vl-plus:free');
const queenModel = openaiChutes('Qwen/Qwen2.5-72B-Instruct');
export const llamaModel = openaiGROQ('llama-3.3-70b-versatile');
const mistralModel = openaiChutes3('unsloth/Mistral-Nemo-Instruct-2407');

const ovhR1Model = openaiOVH('DeepSeek-R1-Distill-Llama-70B');
const chutesR1Model = openaiChutes2('deepseek-ai/DeepSeek-R1-Distill-Llama-70B');
const targonR1Model = openaiTargon('deepseek-ai/DeepSeek-R1-Distill-Llama-70B');

const coderModel = wrapLanguageModel({
    model: chutesR1Model,
    middleware: extractReasoningMiddleware({ tagName: 'think' }),
});