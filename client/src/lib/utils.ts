import { TemplateFiles } from "@repo/common/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function projectFilesMsg(templateFiles: TemplateFiles) {
  return `Project Files:
The following is a list of all project files and their complete contents that are currently visible and accessible to you.
${templateFiles.map(file => `
  ${file.path}:
  \`\`\`
  ${file.content}
  \`\`\`
`)}`;
}

export function projectInstructionsMsg(enhancedPrompt: string) {
  return `Current Message:

${enhancedPrompt}

File Changes:

Here is a list of all files that have been modified since the start of the conversation.
This information serves as the true contents of these files!

The contents include either the full file contents or a diff (when changes are smaller and localized).

Use it to:
 - Understand the latest file modifications
 - Ensure your suggestions build upon the most recent version of the files
 - Make informed decisions about changes
 - Ensure suggestions are compatible with existing code

IMPORTANT: Only give me back those files that contain the implementation of the project and any changed files from the list of files given to you.
Don't give me back any files that are same as the original files.
`;
}