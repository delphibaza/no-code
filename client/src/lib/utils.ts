import { File, Folders } from "@repo/common/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function findFileContent(folders: Folders[], selectedFileName: string): string | undefined {
  for (const item of folders) {
    if (item.type === "file" && item.name === selectedFileName) {
      return item.content; // Return the content if the file matches
    }

    if (item.type === "folder" && item.children) {
      const result = findFileContent(item.children, selectedFileName); // Recursively search in children
      if (result) {
        return result; // Return the content if found in children
      }
    }
  }
  return undefined; // Return undefined if not found
}

export function projectFilesMsg(files: File[]) {
  return `Project Files:
The following is a list of all project files and their complete contents that are currently visible and accessible to you.
${files.map(file => `
  ${file.filePath}:
  \`\`\`
  ${file.content}
  \`\`\`
`)}`;
};

export const projectInstructionsMsg = (enhancedPrompt: string) => `
⚠️ STRICT IMPLEMENTATION REQUIREMENTS

1. ORDER OF OPERATIONS
   FOLLOW THIS SEQUENCE:
   1. Update dependency manifest
   2. Install dependencies
   3. Make file changes
   4. Start development server

2. DEPENDENCY MANAGEMENT
   - IF adding dependencies:
     1. Update dependency manifest first
     2. Run package manager install command
   - IF NO new dependencies:
     - Still run install command first

3. CODE QUALITY
   - NO placeholder implementations
   - NO partial solutions
   - COMPLETE, working code only
   - Production-ready implementations

4. FILE CHANGES
   - Return ONLY modified files
   - Include COMPLETE file contents
   - NO partial updates
   - NO template code

5. EXECUTION SEQUENCE
   Step 1: Dependencies
   - Run appropriate install command (Ex: npm install, yarn install, pnpm install)
   
   Step 2: Development
   - Start development server (Ex: npm run dev, yarn dev, pnpm dev)

YOUR CURRENT TASK:
${enhancedPrompt}

VALIDATION:
✓ Manifest updated before install
✓ Dependencies installed first
✓ Complete file changes provided
✓ Server start command included

These requirements are mandatory.`;

export function chatHistoryMsg() {
  return `Below is the conversation history, including all previous messages along with the most recent assistant response. 
Please reference this context to inform your future responses and maintain conversation continuity. Only install dependencies if the dependency management file (Ex:package.json) has been updated.`
};

export const installCommands = ['npm install', 'yarn install', 'pnpm install', 'npm i'];

export const devCommands = ['npm run dev', 'npm run start', 'npm start', 'yarn dev', 'yarn start', 'pnpm dev', 'pnpm start', 'pnpm run dev', 'pnpm run start'];

export function isInstallCommand(command: string) {
  return installCommands.some(cmd => cmd === command)
}

export function isDevCommand(command: string) {
  return devCommands.some(cmd => cmd === command)
}
