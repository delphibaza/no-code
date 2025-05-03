import { webcontainer } from "@/config/webContainer";
import { API_URL } from "@/lib/constants";
import { mountFiles } from "@/lib/runtime";
import { FileAction } from "@repo/common/types";
import fileSaver from "file-saver";
import JSZip from "jszip";
import { create } from "zustand";
import { useProjectStore } from "./project";
import toast from "react-hot-toast";

const { saveAs } = fileSaver;
interface FilesStore {
  projectFiles: Omit<FileAction, "id" | "type">[];
  modifiedFiles: Set<string>; // Track modified file paths
  originalContent: Map<string, string>; // Store original content for reset
  selectedFile: string | null;
  ignorePatterns: string[];

  // Actions
  updateFile: (filePath: string, content: string) => void;
  setSelectedFile: (filePath: string) => void;
  setProjectFiles: (files: Omit<FileAction, "id" | "type">[]) => void;
  updateProjectFiles: (files: Omit<FileAction, "id" | "type">[]) => void;
  setIgnorePatterns: (patterns: string[]) => void;
  resetFile: (filePath: string) => void;
  saveModifiedFile: (
    projectId: string,
    filePath: string,
    fetchFn: typeof fetch
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  downloadZip: () => Promise<void>;
}

export const useFilesStore = create<FilesStore>()((set, get) => ({
  projectFiles: [],
  modifiedFiles: new Set(),
  originalContent: new Map(),
  selectedFile: null,
  ignorePatterns: [],

  updateFile: (filePath, content) =>
    set((state) => {
      // Store original content if not already stored
      if (!state.originalContent.has(filePath)) {
        const originalFile = state.projectFiles.find(
          (f) => f.filePath === filePath
        );
        if (originalFile) {
          state.originalContent.set(filePath, originalFile.content);
        }
      }

      const newFiles = state.projectFiles.map((file) =>
        file.filePath === filePath
          ? {
              ...file,
              content: content,
            }
          : file
      ) as Omit<FileAction, "id" | "type">[];

      // Mark file as modified
      state.modifiedFiles.add(filePath);

      return {
        projectFiles: newFiles,
        modifiedFiles: new Set(state.modifiedFiles),
        originalContent: new Map(state.originalContent),
      };
    }),

  setSelectedFile: (filePath) => set({ selectedFile: filePath }),

  setProjectFiles: (files) => set({ projectFiles: files }),

  updateProjectFiles: (files) =>
    set((state) => {
      const updatedFiles = [...state.projectFiles];
      for (const file of files) {
        const existingFileIndex = updatedFiles.findIndex(
          (existingFile) => existingFile.filePath === file.filePath
        );
        if (existingFileIndex !== -1) {
          updatedFiles[existingFileIndex].content = file.content;
        } else {
          updatedFiles.push(file);
        }
      }
      return {
        projectFiles: updatedFiles,
      };
    }),

  setIgnorePatterns: (patterns) => set({ ignorePatterns: patterns }),

  resetFile: (filePath) =>
    set((state) => {
      const originalContent = state.originalContent.get(filePath);
      if (!originalContent) return state;

      const newFiles = state.projectFiles.map((file) =>
        file.filePath === filePath
          ? {
              ...file,
              content: originalContent,
            }
          : file
      ) as Omit<FileAction, "id" | "type">[];

      const newModifiedFiles = new Set(state.modifiedFiles);
      newModifiedFiles.delete(filePath);
      const newOriginalContent = new Map(state.originalContent);
      newOriginalContent.delete(filePath);

      return {
        projectFiles: newFiles,
        modifiedFiles: newModifiedFiles,
        originalContent: newOriginalContent,
      };
    }),

  saveModifiedFile: async (
    projectId: string,
    filePath: string,
    customFetch: typeof fetch
  ) => {
    const state = get();
    const globalWebContainer = await webcontainer;

    if (!globalWebContainer) {
      return { success: false, error: "WebContainer not initialized" };
    }

    const file = state.projectFiles.find((f) => f.filePath === filePath);
    if (!file || !state.modifiedFiles.has(filePath)) {
      return { success: false, error: "File not found or not modified" };
    }

    try {
      // Mount file to WebContainer
      await mountFiles(file, globalWebContainer);

      // Save to backend
      const response = await customFetch(`${API_URL}/api/saveFiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          files: [
            {
              filePath: file.filePath,
              content: file.content,
            },
          ],
        }),
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
        originalContent: newOriginalContent,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to save file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save file",
      };
    }
  },

  downloadZip: async () => {
    const { currentProjectId, projects } = useProjectStore.getState();
    if (!currentProjectId || !projects.length) {
      toast.error("Project not found");
      return;
    }
    const zip = new JSZip();
    const files = get().projectFiles;

    const projectName =
      projects.find((p) => p.id === currentProjectId)?.name || "project";

    for (const file of files) {
      // split the path into segments
      const pathSegments = file.filePath.split("/");

      // if there's more than one segment, we need to create folders
      if (pathSegments.length > 1) {
        let currentFolder = zip;

        for (let i = 0; i < pathSegments.length - 1; i++) {
          currentFolder = currentFolder.folder(pathSegments[i])!;
        }
        currentFolder.file(pathSegments[pathSegments.length - 1], file.content);
      } else {
        // if there's only one segment, it's a file in the root
        zip.file(file.filePath, file.content);
      }
    }
    // Generate the zip file and save it
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${projectName}.zip`);
  },
}));
