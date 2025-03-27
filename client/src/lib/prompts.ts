import { File, stripIndents } from "@repo/common/types";
import { minimatch } from "minimatch";

export function projectFilesMsg(files: File[], ignorePatterns: string[]) {
   // Filter out files that match any of the ignore patterns
   const filteredFiles = ignorePatterns
      ? files.filter(file => !ignorePatterns.some(pattern => minimatch(file.filePath, pattern)))
      : files;
   return stripIndents`Project Files:
  The following is a list of all project files and their complete contents that are currently visible and accessible to you.
  ${filteredFiles.map(file => `
    ${file.filePath}:
    \`\`\`
    ${file.content}
    \`\`\``)}
  These are the files that are not being shown to you:
  ${files.filter(file => !filteredFiles.includes(file)).
         map(file => file.filePath)
         .join(', ')}`
};

export const projectInstructionsMsg = (enhancedPrompt: string) => stripIndents`
  ⚠️ STRICT IMPLEMENTATION REQUIREMENTS
  
  1. ORDER OF OPERATIONS
     FOLLOW THIS SEQUENCE:
     1. Update dependencies only if needed
     2. Run install command
     3. Make file changes
     4. Start application
  
  2. DEPENDENCY MANAGEMENT
     - IF adding dependencies:
       1. Update dependency manifest first
       2. Run package manager install command
     - IF NO new dependencies:
       - Still run install command first
  
  3. CODE QUALITY
     - NO placeholder/commented code
     - NO incomplete implementations
     - NO TODO comments
     - MUST provide full, working code
     - NO example/template code
  
  4. FILE MODIFICATIONS
     - Return ONLY modified/new files
     - Include COMPLETE file contents
     - NO partial updates
     - NO changes to configuration files that are previously set up, unless specified or required
     - Each file must be production-ready
  
  5. EXECUTION SEQUENCE
     VERY IMPORTANT - For full stack projects, you need to first change the directory to frontend or backend using the \`cd\` command.
     Step 1: Dependencies (Remember: By default, the packages are not installed)
     - Run appropriate install command (Ex: npm install, yarn install, pnpm install, etc.)
     
     Step 2: Development
     - Start development server (Ex: npm run dev, yarn dev, pnpm dev, etc.)
  
  6. STRICT ADHERENCE TO USER REQUIREMENTS
     - DO NOT modify the user's requirements to make them easier to implement (Ex: Even if the user's requirements don't require such a big framework, follow them exactly)
     - Follow the user's specifications exactly as provided
     - DO NOT assume or change the user's preferred technologies or setup
  
  YOUR CURRENT TASK:
  ${enhancedPrompt}
  
  VALIDATION CHECKLIST:
  ✓ Commands are run in the respective directories
  ✓ Complete, working code (no placeholders)
  ✓ Dependencies updated before install
  ✓ npm install runs first
  ✓ All file changes after install
  ✓ Dev server starts last
  ✓ No TODO/example code
  ✓ Full implementation included
  ✓ Follow the same language as the original code for a particular file. (Ex: If the original code is in TypeScript, the updated code must also be in TypeScript)
  ✓ Strict adherence to user requirements
  
  Don'ts:
  ✗ Don't give install command after file changes, the install command must be the first command.
  ✗ Don't modify the setup, config, etc. files unless specified or required.
  ✗ Don't merge commands, run them separately. 
  Ex: Don't run 'npm install && npm run dev'. Instead, run 'npm install' first, then 'npm run dev'.
  
  Treat these as strict requirements. Any deviation will result in rejection.`;


export function chatHistoryMsg() {
   return stripIndents`Below is the conversation history, including all previous messages along with the most recent assistant response. 
  Please reference this context to inform your future responses and maintain conversation continuity. Only install dependencies if the dependency management file (Ex:package.json) has been updated. But, always give the appropriate application start command.`
};