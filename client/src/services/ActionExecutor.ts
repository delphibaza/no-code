import { mountFiles as mountFile, runCommand } from "@/lib/runtime";
import { isDevCommand, isInstallCommand } from "@/lib/utils";
import { useGeneralStore } from "@/store/generalStore";
import { useProjectStore } from "@/store/projectStore";
import { ActionState, FileAction, ShellAction } from "@repo/common/types";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";

interface Dependencies {
    getWebContainer: () => WebContainer | null;
    getTerminal: () => Terminal | null;
    getShellProcess: () => WebContainerProcess | null;
    setIframeURL: (url: string) => void;
    iframeURL: string;
    setCurrentTab: (tab: 'code' | 'preview') => void;
    updateActionStatus: (messageId: string, actionId: string, status: ActionState['state']) => void;
}
type QueueItem = { messageId: string, action: FileAction | ShellAction };
class ActionExecutor {
    private actionQueue: QueueItem[] = [];
    private isProcessing = false;
    private deps: Dependencies;

    constructor(dependencies: Dependencies) {
        this.deps = dependencies;
    }

    async addAction(messageId: string, action: FileAction | ShellAction) {
        // Add action to queue
        this.actionQueue.push({ messageId, action });
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
                const item = this.actionQueue[0]; // Peek at the next action
                const webContainer = this.deps.getWebContainer();
                const terminal = this.deps.getTerminal();
                const shellProcess = this.deps.getShellProcess();

                if (!webContainer || !terminal || !shellProcess) {
                    // push the action back to the queue
                    this.actionQueue.push(item);
                    console.error('WebContainer or Terminal or Shell Process not found');
                    return;
                }
                if (item.action.type === 'file') {
                    await this.handleFileAction(item.action, webContainer);
                } else if (item.action.type === 'shell') {
                    const shellItem = item as { messageId: string, action: ShellAction };
                    await this.handleShellAction(shellItem, webContainer, terminal);
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
        queueItem: { messageId: string, action: ShellAction },
        webContainer: WebContainer,
        terminal: Terminal
    ) {
        const { messageId, action } = queueItem;
        try {
            this.deps.updateActionStatus(messageId, action.id, 'running');
            const commandArgs = action.command.trim().split(' ');

            if (isInstallCommand(action.command)) {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, true);
                if (exitCode !== 0) throw new Error("Installation failed");
            }
            else if (isDevCommand(action.command)) {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, false);
                if (exitCode === null) {
                    if (!this.deps.iframeURL) {
                        // Todo: Do something with the port
                        webContainer.on('server-ready', (port, url) => {
                            this.deps.setIframeURL(url);
                            setTimeout(() => {
                                this.deps.setCurrentTab('preview');
                            }, 1000);
                        });
                    } else {
                        setTimeout(() => {
                            this.deps.setCurrentTab('preview');
                        }, 1000);
                    }
                } else {
                    throw new Error(`Failed to run command: ${action.command}`);
                }
            }
            else {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, true);
                if (exitCode !== 0) throw new Error(`Failed to run command: ${action.command}`);
            }
            this.deps.updateActionStatus(messageId, action.id, 'completed')
        } catch (error) {
            this.deps.updateActionStatus(messageId, action.id, 'error')
            throw error;
        }
    }
}

export const actionExecutor = new ActionExecutor({
    getWebContainer: () => useGeneralStore.getState().webContainerInstance,
    getTerminal: () => useGeneralStore.getState().terminal,
    getShellProcess: () => useGeneralStore.getState().shellProcess,
    iframeURL: useGeneralStore.getState().iframeURL,
    setIframeURL: (url) => useGeneralStore.getState().setIframeURL(url),
    setCurrentTab: (tab) => useGeneralStore.getState().setCurrentTab(tab),
    updateActionStatus: (messageId, actionId, status) => useProjectStore.getState().updateActionStatus(messageId, actionId, status)
});      