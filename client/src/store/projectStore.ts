import { File } from '@repo/common/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FileContent {
    content: string;
    lastModified: number;
}

interface ProjectState {
    files: Map<string, FileContent>;
    lastModified: number;
    selectedFile: string | null;

    // Actions
    updateFile: (filePath: string, content: string) => void;
    deleteFile: (filePath: string) => void;
    setSelectedFile: (filePath: string | null) => void;
    initializeFiles: (templateFiles: File[]) => void;
}

export const useProjectStore = create<ProjectState>()(
    devtools(
        (set) => ({
            files: new Map(),
            lastModified: Date.now(),
            selectedFile: null,

            updateFile: (filePath, content) =>
                set((state) => {
                    const newFiles = new Map(state.files);
                    newFiles.set(filePath, {
                        content,
                        lastModified: Date.now()
                    })
                    return {
                        files: newFiles,
                        lastModified: Date.now()
                    };
                }),
            deleteFile: (filePath: string) =>
                set((state) => {
                    const newFiles = new Map(state.files);
                    newFiles.delete(filePath);
                    return {
                        files: newFiles,
                        lastModified: Date.now()
                    };
                }),

            setSelectedFile: (filePath) =>
                set({ selectedFile: filePath }),

            initializeFiles: (templateFiles) =>
                set(() => {
                    const initialFiles = new Map<string, FileContent>();
                    templateFiles.forEach(file => {
                        initialFiles.set(file.filePath, {
                            content: file.content,
                            lastModified: Date.now()
                        })
                    })
                    return {
                        files: initialFiles,
                        lastModified: Date.now(),
                    };
                })
        }),
        { name: 'project-store' }
    )
) 