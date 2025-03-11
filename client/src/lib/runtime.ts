import { Artifact, ExistingProject, File, FileAction, MessageHistory, ShellAction } from "@repo/common/types";
import type { WebContainer } from "@webcontainer/api";
import type { Terminal as XTerm } from "@xterm/xterm";
import { buildHierarchy, formatFilesToMount } from "./formatterHelpers";
import { chatHistoryMsg, projectFilesMsg } from "./prompts";
import { isDevCommand } from "./utils";

export function isNewFile(filePath: string, templateFiles: File[]) {
    return templateFiles.every(file => file.filePath !== filePath);
}

export function parseActions(actions: (Partial<FileAction> | Partial<ShellAction>)[]): (FileAction | ShellAction)[] {
    return actions.map(action => {
        if (action.type === 'file') {
            return {
                id: action.id,
                type: 'file',
                filePath: action.filePath || '',
                content: action.content || ''
            } as FileAction;
        } else if (action.type === 'shell') {
            return {
                id: action.id,
                type: 'shell',
                command: action.command || ''
            } as ShellAction;
        }
        return null;
    })
        .filter(action => action !== null)
        .filter(action => action.type === 'file'
            ? !!(action.id && action.filePath && action.content)
            : !!(action.id && action.command)
        ) as (FileAction | ShellAction)[];
}

export async function startShell(terminal: XTerm, webContainer: WebContainer) {
    const args: string[] = [];
    const process = await webContainer.spawn('/bin/jsh', ['--osc', ...args], {
        terminal: {
            cols: terminal.cols ?? 80,
            rows: terminal.rows ?? 15,
        },
    });
    process.output.pipeTo(
        new WritableStream({
            write(data) {
                terminal.write(data);
            },
        })
    );

    const input = process.input.getWriter();
    terminal.onData((data) => {
        input.write(data);
    });

    return process;
}
export async function mountFiles(files: File | File[], webContainerInstance: WebContainer) {
    const filesArray = Array.isArray(files) ? files : [files];
    const hierarchy = buildHierarchy(filesArray);
    const formattedFiles = formatFilesToMount(hierarchy);
    await webContainerInstance.mount(formattedFiles);
}

export function constructMessages(
    currentInput: string,
    currentMessageId: string,
    projectFiles: File[],
    messageHistory: MessageHistory[],
    ignorePatterns: string[]
) {
    // Initialize with system messages
    const payload: MessageHistory[] = [
        {
            id: crypto.randomUUID(),
            role: 'user',
            content: projectFilesMsg(projectFiles, ignorePatterns),
            timestamp: Date.now()
        },
        {
            id: crypto.randomUUID(),
            role: 'user',
            content: chatHistoryMsg(),
            timestamp: Date.now()
        }
    ];
    messageHistory.forEach((message, currentIndex) => {
        const isImportArtifact = message.id === 'import-artifact';

        // Skip import-artifact messages
        if (isImportArtifact) {
            return;
        }
        const nextMessage = messageHistory[currentIndex + 1];
        if (message.id === currentMessageId) {
            const upperMessage = `Assistant Response to Message #${currentIndex}`;
            payload.push({ ...message, content: `${upperMessage}\n ${message.content}` });
        } else if (nextMessage?.id === currentMessageId) {
            const upperMessage = `Previous Message #${currentIndex + 1}`
            const lowerMessage = `(Assistant response below)`
            payload.push({ ...message, role: 'user', content: `${upperMessage}\n ${message.content} \n ${lowerMessage}` });
        } else if (message.role !== 'assistant') {
            const upperMessage = `Previous Message #${currentIndex + 1}`
            const lowerMessage = `(Assistant response omitted)`
            payload.push({ ...message, role: 'user', content: `${upperMessage}\n ${message.content} \n ${lowerMessage}` });
        }
        currentIndex++;
    });
    payload.push({
        id: 'currentMessage',
        role: 'user',
        content: `Current Message : ${currentInput}`,
        rawContent: currentInput,
        timestamp: Date.now()
    });
    return payload;
}

export function getImportArtifact(messages: ExistingProject['messages']) {
    const recentAssistantMessage = messages.findLastIndex(m => m.role === 'assistant');
    const lastShellCommand = (messages[recentAssistantMessage].content as { artifact: Artifact })
        .artifact.actions.findLast(action => action.type === 'shell')?.command;

    // Determine start command
    const startCommand = lastShellCommand && isDevCommand(lastShellCommand)
        ? lastShellCommand
        : 'npm run dev';

    const currentActions: ShellAction[] = [
        {
            id: 0,
            type: 'shell',
            command: 'npm install',
        },
        {
            id: 1,
            type: 'shell',
            command: startCommand,
        }
    ];
    const artifact: Artifact = {
        id: crypto.randomUUID(),
        title: 'Importing Project',
        initialContext: "I'm setting up your project. This may take a moment as I set everything up. Once it's ready, you'll be able to explore and interact with your code.",
        actions: currentActions,
        endingContext: "I've successfully imported your project. I'm ready to assist you with analyzing and improving your code."
    };
    return { artifact, currentActions };
}