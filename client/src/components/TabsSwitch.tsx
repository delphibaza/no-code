import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildHierarchy } from "@/lib/formatterHelpers";
import { FileExplorer } from "./FileExplorer";
import PreviewCode from "./PreviewCode";
import { Terminal } from "./Terminal";
import { useStore } from "@/store/useStore";

export function TabsSwitch() {
    const fileMap = useStore((state) => state.messages);
    const files = Array.from(fileMap.values()).at(-1);
    const setTerminal = useStore((state) => state.setTerminal);
    const folders = buildHierarchy(files?.actions.filter(action => action.type === 'file') || []);

    return (
        <Tabs defaultValue="code" className="w-[60vw]">
            <TabsList className="bg-secondary rounded-3xl space-x-2 px-1">
                <TabsTrigger className="rounded-2xl text-xs" value="code">Code</TabsTrigger>
                <TabsTrigger className="rounded-2xl text-xs" value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="space-y-3">
                <FileExplorer folders={folders} />
                <Terminal onTerminalReady={setTerminal} />
            </TabsContent>
            <TabsContent value="preview" className="md:h-[65vh]">
                <PreviewCode />
            </TabsContent>
        </Tabs>
    );
}