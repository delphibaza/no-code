import { WebContainer } from '@webcontainer/api';
import { create } from 'zustand';

interface StoreState {
    doneStreaming: boolean;
    setDoneStreaming: (done: boolean) => void;
    webContainerInstance: WebContainer | null;
    setWebContainerInstance: (container: WebContainer | null) => void;
    selectedFileName: string;
    setSelectedFileName: (name: string) => void;
}

export const useStore = create<StoreState>((set) => ({
    doneStreaming: true,
    setDoneStreaming: (done) => set({ doneStreaming: done }),
    webContainerInstance: null,
    setWebContainerInstance: (container) => set({ webContainerInstance: container }),
    selectedFileName: "",
    setSelectedFileName: (name) => set({ selectedFileName: name })
}));