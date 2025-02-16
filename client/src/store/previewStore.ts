import { WebContainer } from '@webcontainer/api';
import { create } from 'zustand';

export interface Preview {
    id: string;
    port: number;
    ready: boolean;
    baseUrl: string;
}

interface PreviewStore {
    previews: Map<string, Preview>;
    activePreviewId: string | null;
    webContainer: WebContainer | null;

    addPreview: (preview: Omit<Preview, 'id'>) => string;
    updatePreview: (id: string, updates: Partial<Preview>) => void;
    removePreview: (id: string) => void;
    setActivePreviewId: (id: string | null) => void;
    getPreviewByPort: (port: number) => Preview | undefined;
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

    updatePreview: (id, updates) => {
        set((state) => {
            const preview = state.previews.get(id);
            if (!preview) return state;

            const newPreviews = new Map(state.previews);
            newPreviews.set(id, { ...preview, ...updates });
            return { previews: newPreviews };
        });
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

    getPreviewByPort: (port) => {
        const previews = get().previews;
        return Array.from(previews.values()).find(p => p.port === port);
    },

    setWebContainer: (container) => {
        set({ webContainer: container });
        get().initializeWebContainerEvents();
    },

    initializeWebContainerEvents: () => {
        const { webContainer, updatePreview, removePreview } = get();
        if (!webContainer) return;

        webContainer.on('port', (port, type, url) => {
            const preview = Array.from(get().previews.values()).find(p => p.port === port);

            if (type === 'close' && preview) {
                removePreview(preview.id);
                return;
            }

            if (type === 'open' && preview) {
                updatePreview(preview.id, {
                    ready: type === 'open',
                    baseUrl: url,
                });
            }
        });
    }
}));