import { webcontainer } from "@/config/webContainer";
import { API_URL } from "@/lib/constants";
import { path } from "@/lib/path";
import { mountFiles } from "@/lib/runtime";
import { FileAction } from "@repo/common/types";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import toast from "react-hot-toast";
import { create } from "zustand";
import { useProjectStore } from "./project";

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
  createFile: (filePath: string, fetchFn: typeof fetch) => Promise<void>;
  deleteFile: (filePath: string, fetchFn: typeof fetch) => Promise<void>;
  addFolder: (folderPath: string, fetchFn: typeof fetch) => Promise<void>;
  deleteFolder: (folderPath: string, fetchFn: typeof fetch) => Promise<void>;
  renameFile: (
    oldPath: string,
    newPath: string,
    fetchFn: typeof fetch
  ) => Promise<void>;
  renameFolder: (
    oldPath: string,
    newPath: string,
    fetchFn: typeof fetch
  ) => Promise<void>;
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
    fetchFn: typeof fetch
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
      const response = await fetchFn(`${API_URL}/api/saveFiles`, {
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

  async createFile(filePath: string, fetchFn: typeof fetch): Promise<void> {
    try {
      const globalWebContainer = await webcontainer;

      // Check if file already exists before trying to create it
      const isExists = get().projectFiles.some(
        (file) => file.filePath === filePath
      );

      if (isExists) {
        throw new Error(`EEXIST: file already exists, create '${filePath}'`);
      }

      const dirPath = path.dirname(filePath);

      if (dirPath !== ".") {
        await globalWebContainer.fs.mkdir(dirPath, { recursive: true });
      }

      await globalWebContainer.fs.writeFile(filePath, "");

      set((state) => {
        const newFiles = [...state.projectFiles];
        newFiles.push({
          filePath,
          content: "",
        });
        return {
          projectFiles: newFiles,
        };
      });

      // Use get() to access the setter method from state
      get().setSelectedFile(filePath);
      const projectId = useProjectStore.getState().currentProjectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      // Persist created file to backend
      await saveOrRenameFilesToBackend(
        projectId,
        { type: "save", files: [{ filePath, content: "" }] },
        fetchFn
      );
    } catch (error) {
      console.error("Failed to create file:", error);
      throw error;
    }
  },

  async deleteFile(filePath: string, fetchFn: typeof fetch): Promise<void> {
    try {
      const globalWebContainer = await webcontainer;

      // First check if the file exists in our state
      const fileExists = get().projectFiles.some(
        (file) => file.filePath === filePath
      );

      if (!fileExists) {
        throw new Error(`ENOENT: file does not exist, delete '${filePath}'`);
      }

      // Try to delete the file from the filesystem
      await globalWebContainer.fs.rm(filePath);

      // Update all state in one set operation to maintain consistency
      set((state) => {
        // Clean up modified files and original content
        const newModifiedFiles = new Set(state.modifiedFiles);
        newModifiedFiles.delete(filePath);

        const newOriginalContent = new Map(state.originalContent);
        newOriginalContent.delete(filePath);

        // Filter out the deleted file
        const newFiles = state.projectFiles.filter(
          (file) => file.filePath !== filePath
        );

        let newSelectedFile = state.selectedFile;

        // If the deleted file was selected, find a new file to select
        if (state.selectedFile === filePath) {
          const currentFileIndex = state.projectFiles.findIndex(
            (file) => file.filePath === filePath
          );

          // Try to select next file, then previous file, then first file
          newSelectedFile =
            state.projectFiles[currentFileIndex + 1]?.filePath ||
            state.projectFiles[currentFileIndex - 1]?.filePath ||
            (newFiles.length > 0 ? newFiles[0].filePath : null);
        }

        return {
          projectFiles: newFiles,
          modifiedFiles: newModifiedFiles,
          originalContent: newOriginalContent,
          selectedFile: newSelectedFile,
        };
      });
      const projectId = useProjectStore.getState().currentProjectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      // Persist deleted file to backend
      await deleteFilesToBackend(projectId, [filePath], fetchFn);
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw error;
    }
  },

  async addFolder(folderPath: string, fetchFn: typeof fetch): Promise<void> {
    try {
      const globalWebContainer = await webcontainer;

      // Sanitize folder path - remove trailing slashes
      folderPath = folderPath.replace(/\/+$/, "");

      // Validate folder path
      if (!folderPath || folderPath === "." || folderPath === "/") {
        throw new Error("EINVAL: invalid folder path");
      }

      // Check if folder (or file with same path) already exists
      const folderExists = get().projectFiles.some((file) => {
        // Check if the file path is the folder itself or is inside the folder
        return (
          file.filePath === folderPath ||
          file.filePath.startsWith(`${folderPath}/`)
        );
      });

      if (folderExists) {
        throw new Error(
          `EEXIST: folder already exists, create '${folderPath}'`
        );
      }

      // Create the folder in the filesystem
      await globalWebContainer.fs.mkdir(folderPath, { recursive: true });

      // Create a .gitkeep file inside the folder
      const gitkeepPath = `${folderPath}/.gitkeep`;

      // Write an empty .gitkeep file
      await globalWebContainer.fs.writeFile(gitkeepPath, "");

      // Add the .gitkeep file to projectFiles
      set((state) => {
        const newFiles = [...state.projectFiles];
        newFiles.push({
          filePath: gitkeepPath,
          content: "",
        });
        return {
          projectFiles: newFiles,
        };
      });

      // Don't set the .gitkeep file as selected
      // This keeps the current selection unchanged
      const projectId = useProjectStore.getState().currentProjectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      // Persist created folder to backend
      await saveOrRenameFilesToBackend(
        projectId,
        { type: "save", files: [{ filePath: gitkeepPath, content: "" }] },
        fetchFn
      );
    } catch (error) {
      console.error("Failed to add folder:", error);
      throw error;
    }
  },

  async deleteFolder(folderPath: string, fetchFn: typeof fetch): Promise<void> {
    try {
      const globalWebContainer = await webcontainer;

      await globalWebContainer.fs.rm(folderPath, { recursive: true });
      const filesToDelete: string[] = [];
      // Remove all files that are within this folder from projectFiles
      set((state) => {
        // Filter out files that are in the deleted folder
        const newFiles = state.projectFiles.filter((file) => {
          // Ensure we match the exact folder path or its children
          // This prevents partial string matches (e.g., "src/comp" matching "src/components")
          const filePathParts = file.filePath.split("/");
          const folderPathParts = folderPath.split("/");

          // If the file path has fewer parts than the folder path, it can't be inside this folder
          if (filePathParts.length < folderPathParts.length) {
            return true;
          }

          // Check if all folder path parts match at the beginning of the file path
          for (let i = 0; i < folderPathParts.length; i++) {
            if (filePathParts[i] !== folderPathParts[i]) {
              return true;
            }
          }
          // If we get here, the file is inside the folder we're deleting
          filesToDelete.push(file.filePath);
          return false;
        });

        // Clean up modifiedFiles set
        const newModifiedFiles = new Set(state.modifiedFiles);
        state.modifiedFiles.forEach((filePath) => {
          // Apply the same path matching logic
          const filePathParts = filePath.split("/");
          const folderPathParts = folderPath.split("/");

          if (filePathParts.length >= folderPathParts.length) {
            let isInFolder = true;
            for (let i = 0; i < folderPathParts.length; i++) {
              if (filePathParts[i] !== folderPathParts[i]) {
                isInFolder = false;
                break;
              }
            }
            if (isInFolder) {
              newModifiedFiles.delete(filePath);
            }
          }
        });

        // Clean up originalContent map
        const newOriginalContent = new Map(state.originalContent);
        state.originalContent.forEach((_, filePath) => {
          // Apply the same path matching logic
          const filePathParts = filePath.split("/");
          const folderPathParts = folderPath.split("/");

          if (filePathParts.length >= folderPathParts.length) {
            let isInFolder = true;
            for (let i = 0; i < folderPathParts.length; i++) {
              if (filePathParts[i] !== folderPathParts[i]) {
                isInFolder = false;
                break;
              }
            }
            if (isInFolder) {
              newOriginalContent.delete(filePath);
            }
          }
        });

        // Check if the currently selected file was in the deleted folder
        let newSelectedFile = state.selectedFile;
        if (state.selectedFile) {
          // Apply the same path matching logic
          const filePathParts = state.selectedFile.split("/");
          const folderPathParts = folderPath.split("/");

          if (filePathParts.length >= folderPathParts.length) {
            let isInFolder = true;
            for (let i = 0; i < folderPathParts.length; i++) {
              if (filePathParts[i] !== folderPathParts[i]) {
                isInFolder = false;
                break;
              }
            }

            // If the selected file was in the deleted folder, select a new file
            if (isInFolder) {
              newSelectedFile =
                newFiles.length > 0 ? newFiles[0].filePath : null;
            }
          }
        }

        return {
          projectFiles: newFiles,
          modifiedFiles: newModifiedFiles,
          originalContent: newOriginalContent,
          selectedFile: newSelectedFile,
        };
      });
      const projectId = useProjectStore.getState().currentProjectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      // Persist deleted folder to backend
      await deleteFilesToBackend(projectId, filesToDelete, fetchFn);
    } catch (error) {
      console.error("Failed to delete folder:", error);
      throw error;
    }
  },

  async renameFile(
    oldPath: string,
    newPath: string,
    fetchFn: typeof fetch
  ): Promise<void> {
    try {
      const globalWebContainer = await webcontainer;

      // Validate paths
      if (!oldPath || !newPath) {
        throw new Error("EINVAL: Invalid file paths");
      }

      // Check if source file exists in our state
      const sourceFile = get().projectFiles.find(
        (file) => file.filePath === oldPath
      );

      if (!sourceFile) {
        throw new Error(`ENOENT: Source file does not exist: '${oldPath}'`);
      }

      // Check if destination already exists
      const destinationExists = get().projectFiles.some(
        (file) => file.filePath === newPath
      );

      if (destinationExists) {
        throw new Error(
          `EEXIST: Destination file already exists: '${newPath}'`
        );
      }

      // Check if the parent directory of the destination exists
      const destDirPath = path.dirname(newPath);
      const destDirExists = get().projectFiles.some(
        (file) =>
          path.dirname(file.filePath) === destDirPath ||
          file.filePath.endsWith(`${destDirPath}/.gitkeep`)
      );

      if (destDirPath !== "." && !destDirExists) {
        // Create the parent directory structure if it doesn't exist
        await globalWebContainer.fs.mkdir(destDirPath, { recursive: true });
      }

      // Read the source file content
      const content = sourceFile.content;

      // Create the new file
      await globalWebContainer.fs.rename(oldPath, newPath);

      // Delete the old file
      await globalWebContainer.fs.rm(oldPath);

      // Update state in a single operation
      set((state) => {
        // Add new file to projectFiles
        const newFiles = state.projectFiles.filter(
          (file) => file.filePath !== oldPath
        );
        newFiles.push({
          filePath: newPath,
          content: content,
        });

        // Handle modified files
        const newModifiedFiles = new Set(state.modifiedFiles);
        if (newModifiedFiles.has(oldPath)) {
          newModifiedFiles.delete(oldPath);
          newModifiedFiles.add(newPath);
        }

        // Handle original content
        const newOriginalContent = new Map(state.originalContent);
        if (newOriginalContent.has(oldPath)) {
          const originalContent = newOriginalContent.get(oldPath);
          newOriginalContent.delete(oldPath);
          newOriginalContent.set(newPath, originalContent!);
        }

        // Update selected file if needed
        let newSelectedFile = state.selectedFile;
        if (state.selectedFile === oldPath) {
          newSelectedFile = newPath;
        }

        return {
          projectFiles: newFiles,
          modifiedFiles: newModifiedFiles,
          originalContent: newOriginalContent,
          selectedFile: newSelectedFile,
        };
      });
      const projectId = useProjectStore.getState().currentProjectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      // Persist renamed file to backend
      await saveOrRenameFilesToBackend(
        projectId,
        { type: "rename", files: [{ oldPath, newPath }] },
        fetchFn
      );
    } catch (error) {
      console.error("Failed to rename file:", error);
      throw error;
    }
  },

  async renameFolder(
    oldPath: string,
    newPath: string,
    fetchFn: typeof fetch
  ): Promise<void> {
    try {
      const globalWebContainer = await webcontainer;

      // Normalize paths - remove trailing slashes
      oldPath = oldPath.replace(/\/+$/, "");
      newPath = newPath.replace(/\/+$/, "");

      // Validate paths
      if (!oldPath || !newPath || oldPath === "." || newPath === ".") {
        throw new Error("EINVAL: Invalid folder paths");
      }

      // Check if source folder exists
      const filesInFolder = get().projectFiles.filter(
        (file) =>
          file.filePath === oldPath || file.filePath.startsWith(`${oldPath}/`)
      );

      if (filesInFolder.length === 0) {
        throw new Error(`ENOENT: Source folder does not exist: '${oldPath}'`);
      }

      // Check if destination folder already exists
      const destFolderExists = get().projectFiles.some(
        (file) =>
          file.filePath === newPath || file.filePath.startsWith(`${newPath}/`)
      );

      if (destFolderExists) {
        throw new Error(
          `EEXIST: Destination folder already exists: '${newPath}'`
        );
      }

      // Check if the parent directory of the destination exists
      const destParentDir = path.dirname(newPath);
      const destParentExists =
        destParentDir === "." ||
        get().projectFiles.some(
          (file) =>
            path.dirname(file.filePath) === destParentDir ||
            file.filePath.endsWith(`${destParentDir}/.gitkeep`)
        );

      if (destParentDir !== "." && !destParentExists) {
        // Create the parent directory structure if it doesn't exist
        await globalWebContainer.fs.mkdir(destParentDir, {
          recursive: true,
        });
      }

      // Create new folder in the file system
      await globalWebContainer.fs.mkdir(newPath, { recursive: true });

      // Copy all files from old folder to new folder
      const fileOperations: Promise<void>[] = [];
      const filePathMappings: { oldPath: string; newPath: string }[] = [];

      for (const file of filesInFolder) {
        // Calculate the new path by replacing the prefix
        const newFilePath = file.filePath.replace(
          new RegExp(`^${oldPath}(/|$)`),
          `${newPath}$1`
        );

        // Copy file to new location
        fileOperations.push(
          globalWebContainer.fs.writeFile(newFilePath, file.content)
        );

        filePathMappings.push({
          oldPath: file.filePath,
          newPath: newFilePath,
        });
      }

      // Wait for all file operations to complete
      await Promise.all(fileOperations);

      // Delete the old folder recursively
      await globalWebContainer.fs.rm(oldPath, { recursive: true });

      // Update state in a single operation
      set((state) => {
        // Create new files list with updated paths
        const newFiles = [...state.projectFiles];

        // Remove old files
        const filteredFiles = newFiles.filter(
          (file) =>
            !(
              file.filePath === oldPath ||
              file.filePath.startsWith(`${oldPath}/`)
            )
        );

        // Add new files
        for (const mapping of filePathMappings) {
          const oldFile = state.projectFiles.find(
            (f) => f.filePath === mapping.oldPath
          );
          if (oldFile) {
            filteredFiles.push({
              filePath: mapping.newPath,
              content: oldFile.content,
            });
          }
        }

        // Handle modified files
        const newModifiedFiles = new Set(state.modifiedFiles);
        for (const mapping of filePathMappings) {
          if (newModifiedFiles.has(mapping.oldPath)) {
            newModifiedFiles.delete(mapping.oldPath);
            newModifiedFiles.add(mapping.newPath);
          }
        }

        // Handle original content
        const newOriginalContent = new Map(state.originalContent);
        for (const mapping of filePathMappings) {
          if (newOriginalContent.has(mapping.oldPath)) {
            const originalContent = newOriginalContent.get(mapping.oldPath);
            newOriginalContent.delete(mapping.oldPath);
            newOriginalContent.set(mapping.newPath, originalContent!);
          }
        }

        // Update selected file if needed
        let newSelectedFile = state.selectedFile;
        if (
          state.selectedFile &&
          (state.selectedFile === oldPath ||
            state.selectedFile.startsWith(`${oldPath}/`))
        ) {
          // Replace the old path prefix with the new one
          newSelectedFile = state.selectedFile.replace(
            new RegExp(`^${oldPath}(/|$)`),
            `${newPath}$1`
          );
        }

        return {
          projectFiles: filteredFiles,
          modifiedFiles: newModifiedFiles,
          originalContent: newOriginalContent,
          selectedFile: newSelectedFile,
        };
      });
      const projectId = useProjectStore.getState().currentProjectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      // Persist renamed folder to backend
      await saveOrRenameFilesToBackend(
        projectId,
        { type: "rename", files: filePathMappings },
        fetchFn
      );
    } catch (error) {
      console.error("Failed to rename folder:", error);
      throw error;
    }
  },
}));

async function saveOrRenameFilesToBackend(
  projectId: string,
  data:
    | {
        type: "save";
        files: { filePath: string; content: string }[];
      }
    | {
        type: "rename";
        files: { oldPath: string; newPath: string }[];
      },
  fetchFn: typeof fetch
) {
  const route = data.type === "save" ? "saveFiles" : "renameFiles";
  const response = await fetchFn(`${API_URL}/api/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      files: data.files,
    }),
  });

  if (!response.ok) {
    const errMessage = await response.json();
    throw new Error(errMessage?.msg);
  }

  return response;
}

async function deleteFilesToBackend(
  projectId: string,
  paths: string[],
  fetchFn: typeof fetch
) {
  const response = await fetchFn(
    `${API_URL}/api/deleteFiles?projectId=${projectId}&${paths
      .map((path) => `paths=${path}`)
      .join("&")}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errMessage = await response.json();
    throw new Error(errMessage?.msg);
  }

  return response;
}
