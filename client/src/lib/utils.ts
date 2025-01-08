import { TemplateFiles } from "@repo/common/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProjectFilesMsg(templateFiles: TemplateFiles) {
  return `Project Files:
The following is a list of all project files and their complete contents that are currently visible and accessible to you.
${templateFiles.map(file => `
  ${file.path}:
  \`\`\`
  ${file.content}
  \`\`\`
`).join('\n')}`;
}