import { FolderIcon } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import { findFileContent } from "@/lib/utils";
import { Folders } from "@repo/common/types";
import { FolderComponent } from "./FolderComponent";
import { FileComponent } from "./FileComponent";

function RenderStructure({
    files,
    selectedFileName,
    onFileClick,
}: {
    files: Folders[];
    selectedFileName: string;
    onFileClick: (name: string) => void;
}) {
    return (
        <div className="md:max-h-[55vh] overflow-y-auto">
            {files.map((file) => {
                if (file.type === "folder") {
                    return (
                        <FolderComponent key={file.name} name={file.name}>
                            <RenderStructure
                                files={file.children ?? []}
                                selectedFileName={selectedFileName}
                                onFileClick={onFileClick}
                            />
                        </FolderComponent>
                    );
                } else {
                    return (
                        <FileComponent
                            key={file.name}
                            name={file.name}
                            isSelected={selectedFileName === file.name}
                            onClick={onFileClick}
                        />
                    );
                }
            })}
        </div>
    );
}

export function FileExplorer({ folders, selectedFileName, handleFileClick }: {
    folders: Folders[],
    selectedFileName: string,
    handleFileClick: (name: string) => void
}
) {
    return (
        <div className="grid grid-cols-10 gap-x-2">
            <div className="col-span-2 bg-secondary rounded-sm flex flex-col px-1">
                <div className="text-sm p-2 border-b mb-2 flex items-center gap-x-1">
                    <FolderIcon className="h-4" />
                    Files
                </div>
                <RenderStructure
                    files={folders}
                    selectedFileName={selectedFileName}
                    onFileClick={handleFileClick}
                />
            </div>
            <div className="col-span-8">
                <CodeEditor code={findFileContent(folders, selectedFileName) ?? ""} />
            </div>
        </div>
    )
}