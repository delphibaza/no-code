import { mountFiles as mountFile, runCommand } from "@/lib/runtime";
import { isDevCommand, isInstallCommand } from "@/lib/utils";
import { useMessageStore } from "@/store/messageStore";
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
    updateAction: (actionId: number, action: ActionState) => void;
}
// TODO: Update the state of the actions in the store
// TODO: We need to wait for npm install to finish before running the dev command
class ActionExecutor {
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
            this.deps.updateAction(action.id, { ...action, state: 'created' })
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
            this.deps.updateAction(action.id, { ...action, state: 'running' })
            const commandArgs = action.command.trim().split(' ');

            if (isInstallCommand(action.command)) {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, true);
                if (exitCode !== 0) throw new Error("Installation failed");
            }
            else if (isDevCommand(action.command)) {
                const exitCode = await runCommand(webContainer, terminal, commandArgs, false);
                // TODO: Add a check to see if the server is ready
                // TODO: Update the state of the actions
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
            this.deps.updateAction(action.id, { ...action, state: 'completed' })
        } catch (error) {
            this.deps.updateAction(action.id, { ...action, state: 'error' })
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
    updateAction: (actionId, action) => useMessageStore.getState().updateActionStatus(actionId, action)
})