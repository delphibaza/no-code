import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildHierarchy } from "@/lib/buildHierarchy";
import { File } from "@repo/common/types";
import { useState } from "react";
import PreviewCode from "./PreviewCode";
import { FileExplorer } from "./FileExplorer";

export function TabsSwitch({ files, done }: { files: File[], done: boolean }) {
    const [selectedFileName, setSelectedFileName] = useState<string>("");
    const folders = buildHierarchy(files);

    const handleFileClick = (name: string) => {
        setSelectedFileName(name);
    };

    return (
        <Tabs defaultValue="code" className="w-[60vw]">
            <TabsList className="bg-secondary rounded-3xl space-x-2 px-1">
                <TabsTrigger className="rounded-2xl text-xs" value="code">Code</TabsTrigger>
                <TabsTrigger className="rounded-2xl text-xs" value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="code">
                <FileExplorer
                    folders={folders}
                    handleFileClick={handleFileClick}
                    selectedFileName={selectedFileName}
                />
            </TabsContent>
            <TabsContent value="preview" className="md:h-[65vh]">
                {
                    done
                        ? <PreviewCode done={done} folders={folders} />
                        : <div className="flex justify-center items-center text-sm h-full border-2 rounded-md shadow-sm">
                            No preview available!
                        </div>
                }
            </TabsContent>
        </Tabs>
    );
}