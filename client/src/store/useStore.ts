import { WebContainer, WebContainerProcess } from '@webcontainer/api';
import { create } from 'zustand';
import { FileAction, ParsedMessage } from '@repo/common/types';
import type { Terminal as XTerm } from "@xterm/xterm";

export interface StoreState {
    doneStreaming: boolean;
    setDoneStreaming: (done: boolean) => void;
    webContainerInstance: WebContainer | null;
    setWebContainerInstance: (container: WebContainer | null) => void;
    selectedFileName: string;
    setSelectedFileName: (name: string) => void;
    messages: Map<string, ParsedMessage>;
    updateMessage: (id: string, message: ParsedMessage) => void;
    terminal: XTerm | null,
    setTerminal: (terminal: XTerm) => void;
    shellProcess: WebContainerProcess | null;
    setShellProcess: (process: WebContainerProcess | null) => void;
    iframeURL: string;
    getFiles: () => FileAction[];
    setIframeURL: (url: string) => void;
    currentTab: 'code' | 'preview';
    setCurrentTab: (tab: 'code' | 'preview') => void;
}

export const useStore = create<StoreState>((set, get) => ({
    doneStreaming: false,
    setDoneStreaming: (done) => set({ doneStreaming: done }),
    webContainerInstance: null,
    setWebContainerInstance: (container) => set({ webContainerInstance: container }),
    selectedFileName: "",
    setSelectedFileName: (name) => set({ selectedFileName: name }),
    messages: new Map(),
    updateMessage: (id, message) => set((state) => ({
        messages: new Map(state.messages).set(id, message)
    })),
    terminal: null,
    setTerminal: (terminal) => set({ terminal }),
    getFiles: () => {
        const messages = get().messages;
        if (messages.size === 0) return [];

        // Get the last message's actions
        const lastMessage = Array.from(messages.values()).at(-1);
        if (!lastMessage) return [];

        return lastMessage.actions.filter(action => action.type === 'file')
    },
    shellProcess: null,
    setShellProcess: (process) => set({ shellProcess: process }),
    iframeURL: "",
    setIframeURL: (url) => set({ iframeURL: url }),
    currentTab: 'code',
    setCurrentTab: (tab) => set({ currentTab: tab })
}));