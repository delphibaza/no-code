import { File, FileAction, ShellAction } from "@repo/common/types";
import type { WebContainer } from "@webcontainer/api";
import type { Terminal as XTerm } from "@xterm/xterm";
import { buildHierarchy, formatFilesToMount } from "./formatterHelpers";

export function isNewFile(filePath: string, templateFiles: File[]) {
    return templateFiles.every(file => file.filePath !== filePath);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseActions(actions: any[]): (FileAction | ShellAction)[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return actions.map((action: any) => {
        if (action.type === 'file') {
            return {
                type: 'file',
                filePath: action.filePath || '',
                content: action.content || ''
            }
        } else if (action.type === 'shell') {
            return {
                type: 'shell',
                command: action.command || ''
            }
        }
        return null;
    })
        .filter(action => action !== null)
        .map((action, index, arr) => {
            if (index !== arr.length - 1) return { ...action, state: 'streamed' }
            else return { ...action, state: 'streaming' }
        }) as (FileAction | ShellAction)[];
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
export async function mountFiles(files: File | File[], webContainerInstance: WebContainer) {
    const filesArray = Array.isArray(files) ? files : [files];
    const hierarchy = buildHierarchy(filesArray);
    const formattedFiles = formatFilesToMount(hierarchy);
    await webContainerInstance.mount(formattedFiles);
}

export async function runCommand(
    webContainerInstance: WebContainer,
    terminal: XTerm,
    commands: string[],
    willExit: boolean
) {
    const process = await webContainerInstance.spawn(commands[0], commands.slice(1));
    process.output.pipeTo(
        new WritableStream({
            write(data) {
                terminal.write(data);
            },
        })
    );
    if (willExit) {
        const exitCode = await process.exit;
        return exitCode;
    }
    return null;
}