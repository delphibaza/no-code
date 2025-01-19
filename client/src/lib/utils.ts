import { File, Folders, Directory, Files } from "@repo/common/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WebContainer } from "@webcontainer/api";
import type { Terminal as XTerm } from "@xterm/xterm";

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

export function formatFilesToMount(folders: Folders[], result: Files = {}): Files {
  folders.forEach((item) => {
    if (item.type === "file") {
      result[item.name] = {
        file: {
          contents: item.content || "",
        },
      };
    } else if (item.type === "folder") {
      result[item.name] = {
        directory: {},
      };
      formatFilesToMount(item.children || [], (result[item.name] as Directory).directory);
    }
  });
  return result;
}

export async function startShell(terminal: XTerm, webContainer: WebContainer) {
  const shellProcess = await webContainer.spawn('jsh', {
    terminal: {
      cols: terminal.cols,
      rows: terminal.rows,
    },
  });
  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    })
  );

  const input = shellProcess.input.getWriter();
  terminal.onData((data) => {
    input.write(data);
  });

  return shellProcess;
}

export function isNewFile(filePath: string, templateFiles: File[]) {
  return templateFiles.every(file => file.filePath !== filePath);
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
}

export function projectInstructionsMsg(enhancedPrompt: string) {
  return `Current Message:

${enhancedPrompt}

Here is a list of all files that have been modified since the start of the conversation.
This information serves as the true contents of these files! The contents include the full file contents.

Use it to:
 - Understand the latest file modifications
 - Ensure your suggestions build upon the most recent version of the files
 - Make informed decisions about changes
 - Ensure suggestions are compatible with existing code

Important Instructions for Implementation:

1. File Inclusions and Modifications
- Include Only Modified Files : When providing files, include only those that have been modified or added compared to the original project files.
Package Management Updates :
If additional dependencies are required (beyond those already listed in the provided package management file), include the updated package management file with the new dependencies as the first action. This ensures dependencies can be installed quickly.
For example, if you're using Node.js, update the package.json file with new dependencies. If you're using Python, update the requirements.txt file, etc.

2. Correct Sequence of Commands :
Ensure that commands are provided in the correct order. For example:
If you update the package management file (e.g., package.json for Node.js, requirements.txt for Python), the next command should be an install command specific to your environment.
Example: "npm install" for Node.js, "pip install -r requirements.txt" for Python.
- Providing the install command before updating the package management file will not work correctly.
- Even if the package management file is not updated, you should still provide the appropriate install command as the first action.
- After providing all the necessary files and ensuring dependencies are installed, provide the command to start the application.
Example: "npm run dev" for Node.js, "python app.py" for Python.`
};

export function chatHistoryMsg() {
  return `Below is the conversation history, including all previous messages along with the most recent assistant response. 
Please reference this context to inform your future responses and maintain conversation continuity.`
}

export const installCommands = ['npm install', 'yarn install', 'pnpm install', 'npm i'];
