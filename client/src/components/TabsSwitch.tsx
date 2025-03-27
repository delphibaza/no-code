import { customToast } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { History, Save } from "lucide-react";
import { motion } from 'motion/react';
import toast, { Toaster } from "react-hot-toast";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useShallow } from "zustand/react/shallow";
import { FileExplorer } from "./FileExplorer";
import { Preview } from "./Preview";
import { DEFAULT_TERMINAL_SIZE, TerminalTabs } from "./TerminalTabs";
import { Button } from "./ui/button";

const viewTransition = {
    type: "tween",
    duration: 0.3
};

export function TabsSwitch({ initializingProject, isStreaming }: {
    initializingProject: boolean,
    isStreaming: boolean
}) {
    const { currentTab, setCurrentTab, showTerminal } = useGeneralStore(
        useShallow(state => ({
            currentTab: state.currentTab,
            setCurrentTab: state.setCurrentTab,
            showTerminal: state.showTerminal
        }))
    );
    const { currentProjectId } = useProjectStore(
        useShallow(state => ({
            currentProjectId: state.currentProjectId,
        }))
    );
    const { saveModifiedFile, resetFile, selectedFile, isFileModified } = useFilesStore(
        useShallow(state => ({
            saveModifiedFile: state.saveModifiedFile,
            resetFile: state.resetFile,
            selectedFile: state.selectedFile,
            isFileModified: state.isFileModified,
        }))
    );
    const showFileActions = selectedFile && isFileModified(selectedFile);
    const DEFAULT_EDITOR_SIZE = 100 - DEFAULT_TERMINAL_SIZE;

    return (
        <>
            <Toaster />
            <motion.div
                initial="closed"
                animate="open"
                className={`col-span-8 bg-gray-100 dark:bg-gray-800 rounded-lg h-full ${initializingProject ? 'hidden' : 'block'}`}>
                <div className="flex items-center justify-between px-2 pt-2 pb-2 pr-6 rounded-t-lg">
                    <div className="flex items-center rounded-3xl space-x-1 h-8 bg-primary-foreground max-w-fit px-1 py-3">
                        <Button
                            onClick={() => setCurrentTab('code')}
                            variant={'ghost'}
                            size={'sm'}
                            className={`rounded-2xl text-xs h-7 ${currentTab === 'code' && 'bg-sky-100 dark:bg-gray-800 hover:bg-sky-100 hover:text-blue-500 text-blue-500'}`}>
                            Code
                        </Button>
                        <Button
                            onClick={() => setCurrentTab('preview')}
                            variant={'ghost'}
                            size={'sm'}
                            className={`rounded-2xl text-xs h-7 ${currentTab === 'preview' && 'bg-sky-100 dark:bg-gray-800 hover:bg-sky-100 hover:text-blue-500 text-blue-500'}`}>
                            Preview
                        </Button>
                    </div>
                    <div className={`flex items-center gap-x-2 ${currentTab === 'code' && showFileActions ? 'visible' : 'hidden'}`}>
                        <Button
                            variant={'ghost'}
                            size={'sm'}
                            className="text-xs h-8 hover:bg-gray-200 text-gray-500 dark:bg-gray-800"
                            onClick={async () => {
                                if (currentProjectId && selectedFile) {
                                    const result = await saveModifiedFile(currentProjectId, selectedFile);
                                    if (result.success) {
                                        toast.success('File saved successfully');
                                    } else {
                                        customToast(result?.error || 'Failed to save file');
                                    }
                                }
                            }}
                        >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                        </Button>
                        <Button
                            variant={'ghost'}
                            size={'sm'}
                            className="text-xs h-8 hover:bg-gray-200 text-gray-500 dark:bg-gray-800"
                            onClick={() => selectedFile && resetFile(selectedFile)}
                        >
                            <History className="h-4 w-4 mr-1" />
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Animated Tab Content Container */}
                <div className="relative h-[calc(100%-2.5rem)] overflow-hidden">
                    {/* Code Tab Content */}
                    <motion.div
                        key="code-tab"
                        initial={{ x: currentTab === 'code' ? 0 : '100%' }}
                        animate={{ x: currentTab === 'code' ? 0 : '-100%' }}
                        transition={viewTransition}
                        className={`absolute inset-0 ${currentTab === 'code' ? 'z-10 block overflow-hidden' : 'z-0 hidden'}`}
                    >
                        <PanelGroup direction="vertical" className="h-full">
                            <Panel defaultSize={showTerminal ? DEFAULT_EDITOR_SIZE : 100} minSize={30} className="overflow-hidden">
                                <FileExplorer readonly={isStreaming} />
                            </Panel>
                            <PanelResizeHandle className="h-[2px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" />
                            <Panel defaultSize={DEFAULT_TERMINAL_SIZE} minSize={10} className="h-full">
                                <div className="h-full overflow-hidden">
                                    <TerminalTabs readonly={isStreaming} />
                                </div>
                            </Panel>
                        </PanelGroup>
                    </motion.div>

                    {/* Preview Tab Content */}
                    <motion.div
                        key="preview-tab"
                        initial={{ x: currentTab === 'preview' ? 0 : '100%' }}
                        animate={{ x: currentTab === 'preview' ? 0 : '100%' }}
                        transition={viewTransition}
                        className={`absolute inset-0 ${currentTab === 'preview' ? 'z-10 block overflow-hidden' : 'z-0 hidden'}`}
                    >
                        <Preview />
                    </motion.div>
                </div>
            </motion.div>
        </>
    );
}