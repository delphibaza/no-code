import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGeneralStore } from "@/store/generalStore";
import { useShallow } from "zustand/react/shallow";
import { FileExplorer } from "./FileExplorer";
import PreviewCode from "./PreviewCode";
import { Terminal } from "./Terminal";

export function TabsSwitch() {
    const { setTerminal, currentTab, setCurrentTab } = useGeneralStore(
        useShallow(state => ({
            setTerminal: state.setTerminal,
            currentTab: state.currentTab,
            setCurrentTab: state.setCurrentTab
        }))
    );

    return (
        <Tabs
            value={currentTab}
            onValueChange={(value) => setCurrentTab(value as 'code' | 'preview')}
            className="col-span-8 space-y-2"
        >
            <TabsList className="bg-secondary rounded-3xl space-x-2 px-1">
                <TabsTrigger className="rounded-2xl text-xs" value="code">Code</TabsTrigger>
                <TabsTrigger className="rounded-2xl text-xs" value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="code">
                <FileExplorer />
            </TabsContent>
            <TabsContent value="preview" className="h-full">
                <PreviewCode />
            </TabsContent>
            <div className={`${currentTab === "code" ? "block" : "hidden"} overflow-hidden max-h-[20vh]`}>
                <Terminal onTerminalReady={setTerminal} />
            </div>
        </Tabs>
    );
}