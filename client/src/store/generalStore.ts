import { WebContainerProcess } from '@webcontainer/api';
import type { Terminal as XTerm } from "@xterm/xterm";
import { create } from 'zustand';

export type TerminalType = 'system' | 'user';

export interface TerminalState {
    terminal: XTerm | null;
    shellProcess: WebContainerProcess | null;
}

export interface GeneralStoreState {
    terminals: Map<TerminalType, TerminalState>;
    activeTerminalType: TerminalType;
    currentTab: 'code' | 'preview';
    wordWrap: boolean;
    reasoning: boolean;

    // Actions
    setTerminal: (terminal: XTerm, type?: TerminalType) => void;
    setShellProcess: (process: WebContainerProcess | null, type?: TerminalType) => void;
    setActiveTerminalType: (type: TerminalType) => void;
    setCurrentTab: (tab: 'code' | 'preview') => void;
    setWordWrap: (wordWrap: boolean) => void;
    setReasoning: (reasoning: boolean) => void;
    getActiveTerminal: () => XTerm | null;
    getActiveShellProcess: () => WebContainerProcess | null;
}

export const useGeneralStore = create<GeneralStoreState>((set, get) => ({
    terminals: new Map([
        ['system', { terminal: null, shellProcess: null }],
        ['user', { terminal: null, shellProcess: null }]
    ]),
    activeTerminalType: 'system',
    currentTab: 'code',
    wordWrap: true,
    reasoning: false,

    setTerminal: (terminal, type = 'system') => set((state) => {
        const terminals = new Map(state.terminals);
        const terminalState = terminals.get(type) || { terminal: null, shellProcess: null };
        terminals.set(type, { ...terminalState, terminal });
        return { terminals };
    }),

    setShellProcess: (process, type = 'system') => set((state) => {
        const terminals = new Map(state.terminals);
        const terminalState = terminals.get(type) || { terminal: null, shellProcess: null };
        terminals.set(type, { ...terminalState, shellProcess: process });
        return { terminals };
    }),

    setActiveTerminalType: (type) => set({ activeTerminalType: type }),

    setCurrentTab: (tab) => set({ currentTab: tab }),
    setWordWrap: (wordWrap) => set({ wordWrap }),
    setReasoning: (reasoning) => set({ reasoning }),

    getActiveTerminal: () => {
        const state = get();
        return state.terminals.get(state.activeTerminalType)?.terminal || null;
    },

    getActiveShellProcess: () => {
        const state = get();
        return state.terminals.get(state.activeTerminalType)?.shellProcess || null;
    }
}));