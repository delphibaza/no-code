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
  These are the files that are not being shown to you. These files are READ-ONLY. You should not edit these:
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
  ✓ Double check the functions and components that are used are being imported correctly.
  ✓ When using regular font size ex: text-base in tailwind, use medium font weights when required i.e., font-medium because text-base font is looking too light and not production ready.
  ✓ Match the export type of a file with the import type. You are sometimes exporting src/App.tsx with a named export but importing it as a default export in src/main.tsx, make sure to export it correctly as a default export.
  Don'ts:
  ✗ Without performing the task, don't ask any questions in return for any kind of clarifications, just build the code. If you are not sure about something, just build the code with your best effort.
  ✗ Don't give install command after file changes, the install command must be the first command.
  ✗ Don't give placeholder/commented code, incomplete implementations, TODO comments, example/template code
  ✗ Don't give commands for creating directories or files, ex: mkdir -p src/components, touch src/index.tsx etc. The directories and files are created automatically, just write the code and return the modified/new files.
  ✗ Don't merge commands, run them separately. Ex: Don't run 'npm install && npm run dev'. Instead, give separate commands.
  Any deviation will result in rejection.
  COMMON ERRORS AND THEIR FIXES:
  - Icon or functions import errors: If the Icons and functions are imported from the packages like lucide-react, react-icons etc, are giving errors, don't reinitialize the project like by removing the node_modules folder and package-lock.json file,
  instead, check if the icon or function is available in the package. If not, for icons, use the correct icon name from the package or use another icon that is available in the package that works. Do the same for functions. The most RECOMMENDED way is to use the internet to search for the correct icon or function.`;

export function chatHistoryMsg() {
  return stripIndents`Below is the conversation history, including all previous messages along with the most recent assistant response. 
  Please reference this context to inform your future responses and maintain conversation continuity.
  Only install dependencies if the dependency management file (Ex:package.json) has been updated. 
  But importantly always give the application start command even if you fix an error.`;
}
