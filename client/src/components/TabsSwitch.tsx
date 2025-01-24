import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildHierarchy } from "@/lib/formatterHelpers";
import { FileExplorer } from "./FileExplorer";
import PreviewCode from "./PreviewCode";
import { Terminal } from "./Terminal";
import { useStore } from "@/store/useStore";
import { useShallow } from "zustand/react/shallow";

export function TabsSwitch() {
    const { setTerminal, getFiles, currentTab, setCurrentTab } = useStore(
        useShallow(state => ({
            setTerminal: state.setTerminal,
            getFiles: state.getFiles,
            currentTab: state.currentTab,
            setCurrentTab: state.setCurrentTab
        }))
    );
    const files = getFiles();
    const folders = buildHierarchy(files);

    return (
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'code' | 'preview')} className="col-span-8">
            <TabsList className="bg-secondary rounded-3xl space-x-2 px-1">
                <TabsTrigger className="rounded-2xl text-xs" value="code">Code</TabsTrigger>
                <TabsTrigger className="rounded-2xl text-xs" value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="space-y-3">
                <FileExplorer folders={folders} />
                <Terminal onTerminalReady={setTerminal} />
            </TabsContent>
            <TabsContent value="preview" className="h-full">
                <PreviewCode />
            </TabsContent>
        </Tabs>
    );
}