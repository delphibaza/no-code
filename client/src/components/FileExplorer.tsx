import { buildHierarchy } from "@/lib/formatterHelpers";
import { getLanguageFromFileExtension } from "@/lib/getLanguageExtension";
import { findFileContent } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { Folders } from "@repo/common/types";
import { FolderIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { CodeEditor } from "./CodeEditor";
import { FileComponent } from "./FileComponent";
import { FolderComponent } from "./FolderComponent";

function RenderStructure({ files }: { files: Folders[] }) {
    return (
        <div style={{ scrollbarWidth: 'none' }} className="md:max-h-[70vh] overflow-y-auto">
            {files.map((file) => {
                if (file.type === "folder") {
                    return (
                        <FolderComponent key={file.name} name={file.name}>
                            <RenderStructure files={file.children ?? []} />
                        </FolderComponent>
                    );
                } else {
                    return (
                        <FileComponent
                            key={file.name}
                            name={file.name}
                            filePath={file.filePath ?? file.name}
                        />
                    );
                }
            })}
        </div>
    );
}

export function FileExplorer({ readonly }: { readonly: boolean }) {
    const { projectFiles, selectedFile, isFileModified } = useFilesStore(
        useShallow(state => ({
            projectFiles: state.projectFiles,
            selectedFile: state.selectedFile,
            isFileModified: state.isFileModified
        }))
    );
    const folders = buildHierarchy(projectFiles);

    return (
        <div className="grid grid-cols-10 border">
            <div className="col-span-2 bg-primary-foreground rounded-sm flex flex-col">
                <div className="text-sm p-2 border-b flex items-center justify-between">
                    <div className="flex items-center gap-x-1">
                        <FolderIcon className="h-4" />
                        Files
                    </div>
                    {selectedFile && isFileModified(selectedFile) && (
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    )}
                </div>
                <RenderStructure files={folders} />
            </div>
            <div className="col-span-8">
                <CodeEditor
                    code={findFileContent(projectFiles, selectedFile ?? '') ?? ""}
                    language={getLanguageFromFileExtension(selectedFile ?? '')}
                    readonly={readonly || !selectedFile || !projectFiles.length}
                />
            </div>
        </div>
    )
}