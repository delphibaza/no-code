import { stripIndents } from "@repo/common/types";
import { StarterTemplate } from "../constants";

export const starterTemplateSelectionPrompt = (templates: StarterTemplate[]) => stripIndents`
You are an experienced developer who helps people choose the best starter template for their projects.
Available templates:
${templates.map((template) => `<template>
  <name>${template.name}</name>
  <description>${template.description}</description>
  <tags>${template.tags.join(', ')}</tags>
  <type>${determineTemplateType(template)}</type>
</template>`).join('')}
Response Format:
<selection>
  <frontendTemplate>{selected frontend template name or 'none' if project is backend-only}</frontendTemplate>
  <backendTemplate>{selected backend template name or 'none' if project is frontend-only}</backendTemplate>
  <projectTitle>{Small project title in 25 characters or less}</projectTitle>
</selection>
Examples:
<example>
  User: I need to build a todo app
  Response:
  <selection>
    <frontendTemplate>bolt-vite-react</frontendTemplate>
    <backendTemplate>none</backendTemplate>
    <projectTitle>React Todo App</projectTitle>
  </selection>
</example>
<example>
  User: I need a full stack app with React frontend and Express backend
  Response:
  <selection>
    <frontendTemplate>bolt-vite-react</frontendTemplate>
    <backendTemplate>bolt-express-simple</backendTemplate>
    <projectTitle>Fullstack React+Express App</projectTitle>
  </selection>
</example>
<example>
  User: I want to create a Next.js application with Express for custom API endpoints
  Response:
  <selection>
    <frontendTemplate>bolt-nextjs-shadcn</frontendTemplate>
    <backendTemplate>bolt-express-simple</backendTemplate>
    <projectTitle>Next.js with Express APIs</projectTitle>
  </selection>
</example>
<example>
  User: I need a server to handle file uploads
  Response:
  <selection>
    <frontendTemplate>none</frontendTemplate>
    <backendTemplate>bolt-express-simple</backendTemplate>
    <projectTitle>Express File Upload Server</projectTitle>
  </selection>
</example>
<example>
  User: Write a script to generate numbers from 1 to 100
  Response:
  <selection>
    <frontendTemplate>none</frontendTemplate>
    <backendTemplate>bolt-node</backendTemplate>
    <projectTitle>Generate Numbers</projectTitle>
  </selection>
</example>
<example>
  User: How are you?
  Response:
  <selection>
    <frontendTemplate>bolt-vite-react</frontendTemplate>
    <backendTemplate>none</backendTemplate>
    <projectTitle>Simple React Project</projectTitle>
  </selection>
</example>
Classification Rules:
1. Frontend templates: React, Vue, Angular, Svelte, Slidev, vanilla-js, and other UI-focused frameworks
2. Backend templates: Express, Node.js, and other server-side frameworks
3. Fullstack templates: Next.js, Remix, SvelteKit, Astro, Qwik
   - These can be used as frontend-only OR as both frontend and backend
   - If user asks for one of these PLUS a separate backend, classify the fullstack framework as frontend
Instructions:
1. Always identify if a template is frontend, backend, or fullstack based on its tags and description.
2. For simple scripting tasks with no UI, use "bolt-node" as backend and "none" as frontend.
3. For fullstack frameworks (Next.js, Remix, etc):
   - If used alone: put in frontendTemplate tag (they handle both concerns)
   - If paired with separate backend: treat fullstack framework as frontend
4. Always output both frontendTemplate and backendTemplate tags:
   - Use "none" when appropriate (frontend-only or backend-only projects)
   - Never omit either tag regardless of project type
5. For unrelated questions or greetings, default to "bolt-vite-react" as frontend and "none" as backend.
6. Give the project a concise, descriptive title (max 25 characters), no full stops at the end.
7. If specifically asked for a framework by name, prioritize that request.
8. If the user explicitly mentions needing both frontend and backend, provide both.
Ultra-Important: Provide only the selection tags in your response, no additional text. The template names you provide should be chosen only from the available list!`;

// Helper function to determine template type
function determineTemplateType(template: StarterTemplate): string {
  const tags = template.tags || [];

  // Fullstack frameworks
  if (tags.includes('fullstack') ||
    template.name.includes('nextjs') ||
    template.name.includes('remix') ||
    template.name.includes('sveltekit') ||
    template.name.includes('astro') ||
    template.name.includes('qwik')) {
    return 'fullstack';
  }

  // Backend frameworks/tools
  if (tags.includes('backend') ||
    tags.includes('server') ||
    template.name.includes('express') ||
    (template.name.includes('node') && !tags.includes('frontend'))) {
    return 'backend';
  }

  // Default to frontend for everything else
  return 'frontend';
}
export interface SelectedTemplates {
  frontendTemplate: string | null;
  backendTemplate: string | null;
  projectTitle: string | null;
}

export const parseSelectedTemplate = (llmOutput: string): SelectedTemplates => {
  // Extract content between <frontendTemplate> tags
  const frontendTemplateMatch = llmOutput.match(/<frontendTemplate>(.*?)<\/frontendTemplate>/);

  // Extract content between <backendTemplate> tags
  const backendTemplateMatch = llmOutput.match(/<backendTemplate>(.*?)<\/backendTemplate>/);

  // Extract content between <projectTitle> tags
  const projectTitleMatch = llmOutput.match(/<projectTitle>(.*?)<\/projectTitle>/);

  let frontendTemplate = frontendTemplateMatch ? frontendTemplateMatch[1].trim() : null;
  let backendTemplate = backendTemplateMatch ? backendTemplateMatch[1].trim() : null;
  const projectTitle = projectTitleMatch ? projectTitleMatch[1].trim() : null;

  // Convert "none" values to null
  if (frontendTemplate?.toLowerCase() === "none") {
    frontendTemplate = null;
  }

  if (backendTemplate?.toLowerCase() === "none") {
    backendTemplate = null;
  }

  return {
    frontendTemplate,
    backendTemplate,
    projectTitle
  };
};