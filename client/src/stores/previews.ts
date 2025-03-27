import { Preview } from '@repo/common/types';
import { create } from 'zustand';
import { useGeneralStore } from './general';

interface PreviewStore {
    previews: Preview[];
    activePreviewIndex: number;

    addPreview: (preview: Preview) => void;
    removePreview: (port: number) => void;
    setActivePreviewIndex: (index: number) => void;
}

export const usePreviewStore = create<PreviewStore>((set) => ({
    previews: [],
    activePreviewIndex: 0,

    addPreview: (preview) => {
        const { setCurrentTab } = useGeneralStore.getState();
        set((state) => {
            const newPreviews = [...state.previews, { ...preview }];
            setTimeout(() => setCurrentTab('preview'), 1000);
            return {
                previews: newPreviews,
                activePreviewIndex: newPreviews.length - 1
            };
        });
    },

    removePreview: (port) => {
        set((state) => {
            const newPreviews = state.previews.filter(p => p.port !== port);
            return {
                previews: newPreviews,
                activePreviewIndex: state.activePreviewIndex === port ? 0 : state.activePreviewIndex
            };
        });
    },

    setActivePreviewIndex: (index) => set({ activePreviewIndex: index }),
}));