import { Process } from '@repo/common/types';
import { WebContainer, WebContainerProcess } from '@webcontainer/api';
import type { Terminal as XTerm } from "@xterm/xterm";
import { create } from 'zustand';

export interface GeneralStoreState {
    webContainerInstance: WebContainer | null;
    terminal: XTerm | null,
    shellProcess: WebContainerProcess | null;
    currentTab: 'code' | 'preview';
    processes: Map<string, Process>;
    activeProcessId: string | null;

    addProcess: (process: Omit<Process, 'id'>) => string;
    updateProcess: (id: string, updates: Partial<Process>) => void;
    removeProcess: (id: string) => void;
    setActiveProcessId: (id: string | null) => void;
    getProcessByPort: (port: number) => Process | undefined;
    getProcessByPath: (path: string) => Process | undefined;
    setWebContainerInstance: (container: WebContainer | null) => void;
    setTerminal: (terminal: XTerm) => void;
    setShellProcess: (process: WebContainerProcess | null) => void;
    setCurrentTab: (tab: 'code' | 'preview') => void;
}

export const useGeneralStore = create<GeneralStoreState>((set, get) => ({
    webContainerInstance: null,
    terminal: null,
    shellProcess: null,
    currentTab: 'code',
    processes: new Map(),
    activeProcessId: null,

    addProcess: (process) => {
        const id = generateId();
        set((state) => {
            const newProcesses = new Map(state.processes);
            newProcesses.set(id, { ...process, id, status: 'starting' });
            return { processes: newProcesses };
        });
        return id;
    },

    updateProcess: (id, updates) => {
        set((state) => {
            const process = state.processes.get(id);
            if (!process) return state;

            const newProcesses = new Map(state.processes);
            newProcesses.set(id, { ...process, ...updates });
            return { processes: newProcesses };
        });
    },

    removeProcess: (id) => {
        set((state) => {
            const newProcesses = new Map(state.processes);
            newProcesses.delete(id);
            return {
                processes: newProcesses,
                activeProcessId: state.activeProcessId === id ? null : state.activeProcessId
            };
        });
    },

    setActiveProcessId: (id) => set({ activeProcessId: id }),

    getProcessByPort: (port) => {
        const processes = get().processes;
        return Array.from(processes.values()).find(p => p.port === port);
    },

    getProcessByPath: (path) => {
        const processes = get().processes;
        return Array.from(processes.values()).find(p => p.path === path);
    },
    setWebContainerInstance: (container) => set({ webContainerInstance: container }),
    setTerminal: (terminal) => set({ terminal }),
    setShellProcess: (process) => set({ shellProcess: process }),
    setCurrentTab: (tab) => set({ currentTab: tab })
}));