import { mountFiles as mountFile, runCommand, startShell } from "@/lib/runtime";
import { devCommands, installCommands } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { FileAction, ShellAction } from "@repo/common/types";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";

interface Dependencies {
    getWebContainer: () => WebContainer | null;
    getTerminal: () => Terminal | null;
    getShellProcess: () => WebContainerProcess | null;
    setShellProcess: (process: WebContainerProcess | null) => void;
    setIframeURL: (url: string) => void;
}
// TODO: Update the state of the actions in the store
class ActionExecutor {
    private actions = new Map<string, FileAction | ShellAction>();
    private deps: Dependencies;

    constructor(dependencies: Dependencies) {
        this.deps = dependencies;
    }

    async addAction(action: FileAction | ShellAction) {
        const webContainer = this.deps.getWebContainer();
        const terminal = this.deps.getTerminal();

        if (!webContainer || !terminal) {
            console.error('WebContainer or Terminal not found');
            return;
        }

        if (action.type === 'file') {
            if (this.actions.has(action.filePath)) {
                return;
            }
            this.actions.set(action.filePath, { ...action, state: 'mounting' });
            await this.handleFileAction(action, webContainer);
        } else if (action.type === 'shell') {
            if (this.actions.has(action.command)) {
                return;
            }
            for (const value of this.actions.values()) {
                if (value.type === 'file' && value.state === 'mounting') {

                }
            }
            await this.handleShellAction(action, webContainer, terminal);
        }
    }

    private async handleFileAction(
        action: FileAction,
        webContainer: WebContainer
    ) {
        try {
            await mountFile({ filePath: action.filePath, content: action.content }, webContainer);
            this.actions.set(action.filePath, { ...action, state: 'mounted' });
        } catch (error) {
            this.actions.set(action.filePath, { ...action, state: 'error' });
            console.error('File action failed:', error);
            throw error;
        }
    }

    private async handleShellAction(
        action: ShellAction,
        webContainer: WebContainer,
        terminal: Terminal
    ) {
        try {
            const shellProcess = this.deps.getShellProcess();

            if (!shellProcess) {
                const newShellProcess = await startShell(terminal, webContainer);
                this.deps.setShellProcess(newShellProcess);
            }

            this.actions.set(action.command, { ...action, state: 'running' });

            const commandArgs = action.command.trim().split(' ');
            const isInstallCommand = installCommands.some(cmd => cmd === action.command);
            const isDevCommand = devCommands.some(cmd => cmd === action.command);

            if (isInstallCommand) {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, true);
                if (exitCode !== 0) throw new Error("Installation failed");
            }
            else if (isDevCommand) {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, false);
                // TODO: Add a check to see if the server is ready
                // TODO: Update the state of the actions
                if (exitCode === null) {
                    webContainer.on('server-ready', (port, url) => {
                        this.deps.setIframeURL(url);
                    });
                } else {
                    throw new Error(`Failed to run command: ${action.command}`);
                }
            }
            else {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, true);
                if (exitCode !== 0) throw new Error(`Failed to run command: ${action.command}`);
            }
            this.actions.set(action.command, { ...action, state: 'completed' });
        } catch (error) {
            console.error('Command execution failed:', error);
            throw error;
        }
    }
}

export const actionExecutor = new ActionExecutor({
    getWebContainer: () => useStore.getState().webContainerInstance,
    getTerminal: () => useStore.getState().terminal,
    getShellProcess: () => useStore.getState().shellProcess,
    setShellProcess: (process) => useStore.getState().setShellProcess(process),
    setIframeURL: (url) => useStore.getState().setIframeURL(url)
})