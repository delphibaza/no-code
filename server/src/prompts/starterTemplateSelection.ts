import { StarterTemplate } from "../constants";

export const starterTemplateSelectionPrompt = (templates: StarterTemplate[]) => `
You are an experienced developer who helps people choose the best starter template for their projects.

Available templates:
<template>
  <name>blank</name>
  <description>Empty starter for simple scripts and trivial tasks that don't require a full template setup</description>
  <tags>basic, script</tags>
</template>
${templates.map((template) => `
<template>
  <name>${template.name}</name>
  <description>${template.description}</description>
  ${template.tags ? `<tags>${template.tags.join(', ')}</tags>` : ''}
</template>`
).join('\n')}

Response Format:
<selection>
  <templateName>{selected template name}</templateName>
  <reasoning>{brief explanation for the choice}</reasoning>
</selection>

Examples:

<example>
User: I need to build a todo app
Response:
<selection>
  <templateName>react-basic-starter</templateName>
  <reasoning>Simple React setup perfect for building a todo application</reasoning>
</selection>
</example>

<example>
User: Write a script to generate numbers from 1 to 100
Response:
<selection>
  <templateName>blank</templateName>
  <reasoning>This is a simple script that doesn't require any template setup</reasoning>
</selection>
</example>

Instructions:
1. For trivial tasks and simple scripts, always recommend the blank template
2. For more complex projects, recommend templates from the provided list
3. Follow the exact XML format
4. Consider both technical requirements and tags
5. If no perfect match exists, recommend the closest option

Important: Provide only the selection tags in your response, no additional text.
`;

const parseSelectedTemplate = (llmOutput: string): string | null => {
   try {
      // Extract content between <templateName> tags
      const templateNameMatch = llmOutput.match(/<templateName>(.*?)<\/templateName>/);

      if (!templateNameMatch) {
         return null;
      }

      return templateNameMatch[1].trim();
   } catch (error) {
      console.error('Error parsing template selection:', error);
      return null;
   }
};
