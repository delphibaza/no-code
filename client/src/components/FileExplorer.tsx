import { FolderIcon } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import { findFileContent } from "@/lib/utils";
import { Folders } from "@repo/common/types";
import { FolderComponent } from "./FolderComponent";
import { FileComponent } from "./FileComponent";
import { useStore } from "@/store/useStore";

function RenderStructure({ files }: { files: Folders[] }) {
    return (
        <div style={{ scrollbarWidth: "thin" }} className="md:max-h-[55vh] overflow-y-auto">
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
                        />
                    );
                }
            })}
        </div>
    );
}

export function FileExplorer({ folders }: { folders: Folders[] }) {
    const selectedFileName = useStore((state) => state.selectedFileName);
    return (
        <div className="grid grid-cols-10 gap-x-2">
            <div className="col-span-2 bg-secondary rounded-sm flex flex-col px-1">
                <div className="text-sm p-2 border-b mb-2 flex items-center gap-x-1">
                    <FolderIcon className="h-4" />
                    Files
                </div>
                <RenderStructure files={folders} />
            </div>
            <div className="col-span-8">
                <CodeEditor code={findFileContent(folders, selectedFileName) ?? ""} />
            </div>
        </div>
    )
}