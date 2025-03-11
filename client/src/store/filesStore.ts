import { API_URL } from "@/lib/constants";
import { mountFiles } from "@/lib/runtime";
import { FileAction } from "@repo/common/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { usePreviewStore } from "./previewStore";

interface FilesStore {
    projectFiles: Omit<FileAction, 'id' | 'type'>[];
    modifiedFiles: Set<string>;  // Track modified file paths
    originalContent: Map<string, string>;  // Store original content for reset
    selectedFile: string | null;
    ignorePatterns: string[];
    lastModified: number;

    // Actions
    updateFile: (filePath: string, content: string) => void;
    setSelectedFile: (filePath: string) => void;
    updateProjectFiles: (files: (Omit<FileAction, 'id' | 'type'>)[]) => void;
    setIgnorePatterns: (patterns: string[]) => void;
    markFileAsModified: (filePath: string) => void;
    resetFile: (filePath: string) => void;
    isFileModified: (filePath: string) => boolean;
    saveModifiedFile: (projectId: string, filePath: string) => Promise<{
        success: boolean;
        error?: string;
    }>
}

export const useFilesStore = create<FilesStore>()(
    devtools(
        (set, get) => ({
            projectFiles: [],
            modifiedFiles: new Set(),
            originalContent: new Map(),
            selectedFile: null,
            ignorePatterns: [],
            lastModified: Date.now(),

            updateFile: (filePath, content) =>
                set((state) => {
                    // Store original content if not already stored
                    if (!state.originalContent.has(filePath)) {
                        const originalFile = state.projectFiles.find(f => f.filePath === filePath);
                        if (originalFile) {
                            state.originalContent.set(filePath, originalFile.content);
                        }
                    }

                    const newFiles = state.projectFiles.map(file =>
                        file.filePath === filePath ? {
                            ...file,
                            content: content
                        } : file
                    ) as (Omit<FileAction, 'id' | 'type'>)[];

                    // Mark file as modified
                    state.modifiedFiles.add(filePath);

                    return {
                        projectFiles: newFiles,
                        lastModified: Date.now(),
                        modifiedFiles: new Set(state.modifiedFiles),
                        originalContent: new Map(state.originalContent)
                    };
                }),

            setSelectedFile: (filePath) =>
                set({ selectedFile: filePath }),

            updateProjectFiles: (files) =>
                set({ projectFiles: files }),

            setIgnorePatterns: (patterns) =>
                set({ ignorePatterns: patterns }),

            markFileAsModified: (filePath) =>
                set((state) => ({
                    modifiedFiles: new Set(state.modifiedFiles.add(filePath))
                })),

            resetFile: (filePath) =>
                set((state) => {
                    const originalContent = state.originalContent.get(filePath);
                    if (!originalContent) return state;

                    const newFiles = state.projectFiles.map(file =>
                        file.filePath === filePath ? {
                            ...file,
                            content: originalContent
                        } : file
                    ) as (Omit<FileAction, 'id' | 'type'>)[];

                    const newModifiedFiles = new Set(state.modifiedFiles);
                    newModifiedFiles.delete(filePath);

                    return {
                        projectFiles: newFiles,
                        modifiedFiles: newModifiedFiles,
                        lastModified: Date.now()
                    };
                }),

            isFileModified: (filePath) => get().modifiedFiles.has(filePath),

            saveModifiedFile: async (projectId: string, filePath: string) => {
                const state = get();
                const webContainer = usePreviewStore.getState().webContainer;

                if (!webContainer) {
                    return { success: false, error: "WebContainer not initialized" };
                }

                const file = state.projectFiles.find(f => f.filePath === filePath);
                if (!file || !state.modifiedFiles.has(filePath)) {
                    return { success: false, error: "File not found or not modified" };
                }

                try {
                    // Mount file to WebContainer
                    await mountFiles(file, webContainer);

                    // Save to backend
                    const response = await fetch(`${API_URL}/api/saveFiles`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            projectId,
                            files: [{
                                filePath: file.filePath,
                                content: file.content
                            }]
                        })
                    });

                    if (!response.ok) {
                        const errMessage = await response.json();
                        throw new Error(errMessage?.msg);
                    }

                    const newModifiedFiles = new Set(state.modifiedFiles);
                    newModifiedFiles.delete(filePath);
                    const newOriginalContent = new Map(state.originalContent);
                    newOriginalContent.delete(filePath);

                    set({
                        modifiedFiles: newModifiedFiles,
                        originalContent: newOriginalContent
                    });

                    return { success: true };
                } catch (error) {
                    console.error('Failed to save file:', error);
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to save file'
                    };
                }
            },
        })
    )
)