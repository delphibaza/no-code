import { STARTER_TEMPLATES } from "../constants";
import { getGitHubRepoContent } from "./getRepoContent";

export async function getTemplate(templateName: string) {
    const template = STARTER_TEMPLATES.find((t) => t.name == templateName);

    if (!template) {
        return null;
    }
    const { githubRepo, folder } = template;
    const files = await getGitHubRepoContent(githubRepo, folder);

    // Removes the folder from the file path, ex: node/package.json -> package.json, only needed when folder is provided
    let filteredFiles = folder
        ? files.map(file => ({ ...file, filePath: file.filePath.replace(`${folder}/`, '') }))
        : files;

    /*
     * ignoring common unwanted files
     * exclude    .git
     */
    filteredFiles = filteredFiles.filter((x) => x.filePath.startsWith('.git') == false);

    // exclude    lock files
    const commonLockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    filteredFiles = filteredFiles.filter((x) => commonLockFiles.includes(x.name) == false);

    // exclude    .bolt
    filteredFiles = filteredFiles.filter((x) => x.filePath.startsWith('.bolt') == false);

    // check for ignore file in .bolt folder
    const templateIgnoreFile = files.find((x) => x.filePath.startsWith('.bolt') && x.name == 'ignore');
    let ignorePatterns: string[] = [];
    if (templateIgnoreFile) {
        // redacting files specified in ignore file
        ignorePatterns = templateIgnoreFile.content.split('\n').map((x) => x.trim()).filter(x => x.length > 0);
    }
    const templatePromptFile = files.filter((x) => x.filePath.startsWith('.bolt')).find((x) => x.name == 'prompt');

    return {
        templateFiles: filteredFiles,
        ignorePatterns: ignorePatterns,
        templatePrompt: templatePromptFile?.content ?? '',
    };
}