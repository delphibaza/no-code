import { mountFiles as mountFile, runCommand } from "@/lib/runtime";
import { isDevCommand, isInstallCommand } from "@/lib/utils";
import { useProjectStore } from "@/store/projectStore";
import { useStore } from "@/store/useStore";
import { ActionState, FileAction, ShellAction } from "@repo/common/types";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";

interface Dependencies {
    getWebContainer: () => WebContainer | null;
    getTerminal: () => Terminal | null;
    getShellProcess: () => WebContainerProcess | null;
    setIframeURL: (url: string) => void;
    setCurrentTab: (tab: 'code' | 'preview') => void;
    updateActionStatus: (actionId: string, status: ActionState) => void;
}
class ActionExecutor {
    private actionQueue: Array<FileAction | ShellAction> = [];
    private isProcessing = false;
    private deps: Dependencies;

    constructor(dependencies: Dependencies) {
        this.deps = dependencies;
    }

    async addAction(action: FileAction | ShellAction) {
        // Add action to queue
        this.actionQueue.push(action);
        // Start processing if not already processing
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    private async processQueue() {
        if (this.isProcessing || this.actionQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.actionQueue.length > 0) {
                const action = this.actionQueue[0]; // Peek at the next action
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
                // Remove the processed action
                this.actionQueue.shift();
            }
        } catch (error) {
            console.error('Error processing action queue:', error);
            // Clear the queue on error to prevent stuck state
            this.actionQueue = [];
        } finally {
            this.isProcessing = false;
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
            this.deps.updateActionStatus(action.id, { ...action, state: 'running' });
            const commandArgs = action.command.trim().split(' ');

            if (isInstallCommand(action.command)) {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, true);
                if (exitCode !== 0) throw new Error("Installation failed");
            }
            else if (isDevCommand(action.command)) {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, false);
                // TODO: Add a check to see if the server is ready
                if (exitCode === null) {
                    webContainer.on('server-ready', (port, url) => {
                        this.deps.setIframeURL(url);
                        this.deps.setCurrentTab('preview')
                    });
                } else {
                    throw new Error(`Failed to run command: ${action.command}`);
                }
            }
            else {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, true);
                if (exitCode !== 0) throw new Error(`Failed to run command: ${action.command}`);
            }
            this.deps.updateActionStatus(action.id, { ...action, state: 'completed' })
        } catch (error) {
            this.deps.updateActionStatus(action.id, { ...action, state: 'error' })
            throw error;
        }
    }
}

export const actionExecutor = new ActionExecutor({
    getWebContainer: () => useStore.getState().webContainerInstance,
    getTerminal: () => useStore.getState().terminal,
    getShellProcess: () => useStore.getState().shellProcess,
    setIframeURL: (url) => useStore.getState().setIframeURL(url),
    setCurrentTab: (tab) => useStore.getState().setCurrentTab(tab),
    updateActionStatus: (actionId, action) => useProjectStore.getState().updateActionStatus(actionId, action)
})