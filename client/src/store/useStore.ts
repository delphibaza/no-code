import { WebContainer, WebContainerProcess } from '@webcontainer/api';
import { create } from 'zustand';
import { ParsedMessage } from '@repo/common/types';
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
    setIframeURL: (url: string) => void;
}

export const useStore = create<StoreState>((set) => ({
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
    setTerminal: (terminal) => set({ terminal: terminal }),
    shellProcess: null,
    setShellProcess: (process) => set({ shellProcess: process }),
    iframeURL: "",
    setIframeURL: (url) => set({ iframeURL: url }),
}));