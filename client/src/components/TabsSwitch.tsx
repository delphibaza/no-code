import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildHierarchy } from "@/lib/buildHierarchy";
import { File } from "@repo/common/types";
import { FileExplorer } from "./FileExplorer";
import PreviewCode from "./PreviewCode";

export function TabsSwitch({ files }: { files: File[] }) {
    const folders = buildHierarchy(files);

    return (
        <Tabs defaultValue="code" className="w-[60vw]">
            <TabsList className="bg-secondary rounded-3xl space-x-2 px-1">
                <TabsTrigger className="rounded-2xl text-xs" value="code">Code</TabsTrigger>
                <TabsTrigger className="rounded-2xl text-xs" value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="code">
                <FileExplorer folders={folders} />
            </TabsContent>
            <TabsContent value="preview" className="md:h-[65vh]">
                <PreviewCode folders={folders} />
            </TabsContent>
        </Tabs>
    );
}