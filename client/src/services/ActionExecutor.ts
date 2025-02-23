import { mountFiles as mountFile } from "@/lib/runtime";
import { isDevCommand, isInstallCommand, removeTrailingNewlines } from "@/lib/utils";
import { useGeneralStore } from "@/store/generalStore";
import { usePreviewStore } from "@/store/previewStore";
import { useProjectStore } from "@/store/projectStore";
import { ActionState, FileAction, Preview, ShellAction, WORK_DIR } from "@repo/common/types";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import type { Terminal as XTerm } from "@xterm/xterm";
import { Terminal } from "@xterm/xterm";

interface Dependencies {
    addPreview: (preview: Omit<Preview, 'id'>) => string;
    setActivePreviewId: (id: string | null) => void;
    getWebContainer: () => WebContainer | null;
    getTerminal: () => Terminal | null;
    getShellProcess: () => WebContainerProcess | null;
    setCurrentTab: (tab: 'code' | 'preview') => void;
    getPreviewByPath: (path: string) => Preview | undefined;
    updateActionStatus: (messageId: string, actionId: string, status: ActionState['state']) => void;
}
type QueueItem = { messageId: string, action: FileAction | ShellAction };
class ActionExecutor {
    private actionQueue: QueueItem[] = [];
    private isProcessing = false;

    constructor(private deps: Dependencies) { }

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

    private async handleDevCommand(
        webContainer: WebContainer,
        terminal: Terminal,
        command: string,
    ) {
        const { output } = await webContainer.spawn('pwd');
        const cwd = (await output.getReader().read()).value ?? WORK_DIR;
        const trimmedCWD = removeTrailingNewlines(cwd.trim());
        if (this.deps.getPreviewByPath(trimmedCWD)) {
            this.deps.setCurrentTab('preview');
            return;
        }
        const exitCode = await this.runCommand(webContainer, terminal, command, false);
        if (exitCode === null) {
            webContainer.on('server-ready', (port, url) => {
                const previewId = this.deps.addPreview({
                    port,
                    cwd: trimmedCWD,
                    ready: true,
                    baseUrl: url,
                });
                this.deps.setActivePreviewId(previewId);
                setTimeout(() => {
                    this.deps.setCurrentTab('preview');
                }, 1000);
            });
        } else {
            throw new Error(`Failed to run command: ${command}`);
        }
    }

    private async runCommand(
        webContainerInstance: WebContainer,
        terminal: XTerm,
        command: string,
        willExit: boolean
    ) {
        const process = await webContainerInstance.spawn('jsh', ['-c', command], {
            env: { npm_config_yes: true },
        });
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

    private async handleShellAction(
        queueItem: { messageId: string, action: ShellAction },
        webContainer: WebContainer,
        terminal: Terminal
    ) {
        const { messageId, action } = queueItem;
        try {
            this.deps.updateActionStatus(messageId, action.id, 'running');

            if (isInstallCommand(action.command)) {
                const exitCode = await this.runCommand(webContainer, terminal, action.command, true);
                if (exitCode !== 0) throw new Error("Installation failed");
            }
            else if (isDevCommand(action.command)) {
                await this.handleDevCommand(webContainer, terminal, action.command);
            }
            else {
                const exitCode = await this.runCommand(webContainer, terminal, action.command, true);
                if (exitCode !== 0) throw new Error(`Failed to run command: ${action.command}`);
            }
            this.deps.updateActionStatus(messageId, action.id, 'completed');
        } catch (error) {
            this.deps.updateActionStatus(messageId, action.id, 'error');
            throw error;
        }
    }
}

export const actionExecutor = new ActionExecutor({
    getWebContainer: () => usePreviewStore.getState().webContainer,
    addPreview: (preview) => usePreviewStore.getState().addPreview(preview),
    setActivePreviewId: (id) => usePreviewStore.getState().setActivePreviewId(id),
    getTerminal: () => useGeneralStore.getState().terminal,
    getShellProcess: () => useGeneralStore.getState().shellProcess,
    setCurrentTab: (tab) => useGeneralStore.getState().setCurrentTab(tab),
    getPreviewByPath: (path) => usePreviewStore.getState().getPreviewByPath(path),
    updateActionStatus: (messageId, actionId, status) => useProjectStore.getState().updateActionStatus(messageId, actionId, status)
});      