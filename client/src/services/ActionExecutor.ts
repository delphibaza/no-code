import { mountFiles as mountFile, runCommand } from "@/lib/runtime";
import { devCommands, installCommands } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { FileAction, ShellAction } from "@repo/common/types";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";

interface Dependencies {
    getWebContainer: () => WebContainer | null;
    getTerminal: () => Terminal | null;
    getShellProcess: () => WebContainerProcess | null;
    setIframeURL: (url: string) => void;
    setCurrentTab: (tab: 'code' | 'preview') => void;
}
// TODO: Update the state of the actions in the store
// TODO: We need to wait for npm install to finish before running the dev command
class ActionExecutor {
    private actions = new Map<number, FileAction | ShellAction>();
    private deps: Dependencies;

    constructor(dependencies: Dependencies) {
        this.deps = dependencies;
    }

    async addAction(action: FileAction | ShellAction) {
        const webContainer = this.deps.getWebContainer();
        const terminal = this.deps.getTerminal();
        const shellProcess = this.deps.getShellProcess();

        if (!webContainer || !terminal || !shellProcess) {
            console.error('WebContainer or Terminal or Shell Process not found');
            return;
        }

        if (action.type === 'file') {
            await this.handleFileAction(action, webContainer);
        } else if (action.type === 'shell') {
            await this.handleShellAction(action, webContainer, terminal);
        }
    }

    private async handleFileAction(
        action: FileAction,
        webContainer: WebContainer
    ) {
        try {
            await mountFile({ filePath: action.filePath, content: action.content }, webContainer);
        } catch (error) {
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
            this.actions.set(action.id, { ...action, state: 'running' });

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
                        this.deps.setCurrentTab('preview')
                        this.actions.clear();
                    });
                } else {
                    throw new Error(`Failed to run command: ${action.command}`);
                }
            }
            else {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, true);
                if (exitCode !== 0) throw new Error(`Failed to run command: ${action.command}`);
            }
            this.actions.set(action.id, { ...action, state: 'completed' });
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
    setIframeURL: (url) => useStore.getState().setIframeURL(url),
    setCurrentTab: (tab) => useStore.getState().setCurrentTab(tab)
})