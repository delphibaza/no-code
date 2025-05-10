import { stripIndents } from "@repo/common/constants";
import { File } from "@repo/common/types";
import { minimatch } from "minimatch";

export function projectFilesMsg(files: File[], ignorePatterns: string[]) {
  // Filter out files that match any of the ignore patterns
  const filteredFiles = ignorePatterns
    ? files.filter(
        (file) =>
          !ignorePatterns.some((pattern) => minimatch(file.filePath, pattern))
      )
    : files;
  return stripIndents`Project Files:
  The following is a list of all project files and their complete contents that are currently visible and accessible to you.
  ${filteredFiles.map(
    (file) => `
    ${file.filePath}:
    \`\`\`
    ${file.content}
    \`\`\``
  )}
  These are the files that are not being shown to you:
  ${files
    .filter((file) => !filteredFiles.includes(file))
    .map((file) => file.filePath)
    .join(", ")}`;
}

export const projectInstructionsMsg = (
  currTask: string
) => stripIndents`⚠️ STRICT IMPLEMENTATION REQUIREMENTS
ORDER OF OPERATIONS:
1. Update dependencies only if needed (don't modify the package.json just to modify the project name)
2. Run package manager install command, even if dependencies are not updated. Remember: By default, the packages are not installed (Ex: npm install, yarn install, pnpm install, etc.)
3. Make file changes and return ONLY modified/new files
4. Start development server (Ex: npm run dev, yarn dev, pnpm dev, etc.)
  YOUR CURRENT TASK: ${currTask}
  VALIDATION CHECKLIST:
  ✓ For full-stack projects: Commands are run in the respective directories (Ex: run commands in the frontend and backend directories by running the \`cd\` command)
  ✓ Follow the order of operations mentioned above.
  ✓ Make the code modular i.e. don't generate a single file with all the code. Divide the code into multiple files.
  Don'ts:
  ✗ Don't give install command after file changes, the install command must be the first command.
  ✗ Don't give placeholder/commented code, incomplete implementations, TODO comments, example/template code
  ✗ Don't merge commands, run them separately. Ex: Don't run 'npm install && npm run dev'. Instead, give separate commands.
  Any deviation will result in rejection.`;

export function chatHistoryMsg() {
  return stripIndents`Below is the conversation history, including all previous messages along with the most recent assistant response. 
  Please reference this context to inform your future responses and maintain conversation continuity.
  Only install dependencies if the dependency management file (Ex:package.json) has been updated. 
  But importantly always give the application start command even if you fix an error.`;
}
