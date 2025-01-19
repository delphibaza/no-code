import { File, Folders, Directory, Files } from "@repo/common/types";

export function buildHierarchy(files: File[]): Folders[] {
    const root: Folders = { type: "folder", name: "root", children: [] };

    files.forEach(({ filePath, content }) => {
        const parts = filePath.split("/");
        let currentFolder = root;

        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                // Add file to the current folder
                currentFolder.children = currentFolder.children || [];
                currentFolder.children.push({ type: "file", name: part, content });
            } else {
                // Ensure the folder exists
                currentFolder.children = currentFolder.children || [];
                let folder = currentFolder.children.find(
                    (child) => child.type === "folder" && child.name === part
                ) as Folders;

                if (!folder) {
                    folder = { type: "folder", name: part, children: [] };
                    currentFolder.children.push(folder);
                }

                currentFolder = folder;
            }
        });
    });

    return root.children || [];
}

export function formatFilesToMount(folders: Folders[], result: Files = {}): Files {
    folders.forEach((item) => {
        if (item.type === "file") {
            result[item.name] = {
                file: {
                    contents: item.content || "",
                },
            };
        } else if (item.type === "folder") {
            result[item.name] = {
                directory: {},
            };
            formatFilesToMount(item.children || [], (result[item.name] as Directory).directory);
        }
    });
    return result;
}