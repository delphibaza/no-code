import { Preview } from '@repo/common/types';
import { WebContainer } from '@webcontainer/api';
import { create } from 'zustand';

interface PreviewStore {
    previews: Map<string, Preview>;
    activePreviewId: string | null;
    webContainer: WebContainer | null;

    addPreview: (preview: Omit<Preview, 'id'>) => string;
    removePreview: (id: string) => void;
    setActivePreviewId: (id: string | null) => void;
    getPreviewByPath: (path: string) => Preview | undefined;
    setWebContainer: (container: WebContainer) => void;
    initializeWebContainerEvents: () => void;
}

export const usePreviewStore = create<PreviewStore>((set, get) => ({
    previews: new Map(),
    activePreviewId: null,
    webContainer: null,

    addPreview: (preview) => {
        const id = crypto.randomUUID();
        set((state) => {
            const newPreviews = new Map(state.previews);
            newPreviews.set(id, { ...preview, id });
            return { previews: newPreviews };
        });
        return id;
    },

    removePreview: (id) => {
        set((state) => {
            const newPreviews = new Map(state.previews);
            newPreviews.delete(id);
            return {
                previews: newPreviews,
                activePreviewId: state.activePreviewId === id ? null : state.activePreviewId
            };
        });
    },

    setActivePreviewId: (id) => set({ activePreviewId: id }),

    getPreviewByPath: (path) => {
        const previews = get().previews;
        return Array.from(previews.values()).find(p => p.cwd === path);
    },

    setWebContainer: (container) => {
        set({ webContainer: container });
        get().initializeWebContainerEvents();
    },

    initializeWebContainerEvents: () => {
        const { webContainer, removePreview } = get();
        if (!webContainer) return;

        webContainer.on('port', (port, type) => {
            const preview = Array.from(get().previews.values()).find(p => p.port === port);

            if (type === 'close' && preview) {
                console.log('Port closed for preview:', preview);
                removePreview(preview.id);
                return;
            }
        });
    }
}));