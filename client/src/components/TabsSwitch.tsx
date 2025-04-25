import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useFetch from "@/hooks/useFetch";
import { useHandleDeploy } from "@/hooks/useHandleDeploy";
import { customToast } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { History, MousePointerClick, Save } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useShallow } from "zustand/react/shallow";
import { FileExplorer } from "./FileExplorer";
import { Preview } from "./Preview";
import { DEFAULT_TERMINAL_SIZE, TerminalTabs } from "./TerminalTabs";
import { Button } from "./ui/button";

const viewTransition = {
  type: "tween",
  duration: 0.3,
};

// Tab button component to reduce repetition
const TabButton = memo(
  ({
    label,
    isActive,
    onClick,
  }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <Button
      onClick={onClick}
      variant={"ghost"}
      size={"sm"}
      className={`rounded-2xl text-xs h-7 ${
        isActive &&
        "bg-sky-100 dark:bg-gray-800 hover:bg-sky-100 hover:text-blue-500 text-blue-500"
      }`}
    >
      {label}
    </Button>
  )
);
TabButton.displayName = "TabButton";

export function TabsSwitch({
  initializingProject,
  isStreaming,
}: {
  initializingProject: boolean;
  isStreaming: boolean;
}) {
  const { currentTab, setCurrentTab, showTerminal } = useGeneralStore(
    useShallow((state) => ({
      currentTab: state.currentTab,
      setCurrentTab: state.setCurrentTab,
      showTerminal: state.showTerminal,
    }))
  );
  const { currentProjectId } = useProjectStore(
    useShallow((state) => ({
      currentProjectId: state.currentProjectId,
    }))
  );
  const { modifiedFiles, selectedFile, saveModifiedFile, resetFile } =
    useFilesStore(
      useShallow((state) => ({
        modifiedFiles: state.modifiedFiles,
        selectedFile: state.selectedFile,
        saveModifiedFile: state.saveModifiedFile,
        resetFile: state.resetFile,
      }))
    );
  const { customFetch } = useFetch();
  const { deployingTo, hasNetlifyToken, hasVercelToken, handleDeploy } =
    useHandleDeploy();
  const showFileActions = selectedFile && modifiedFiles.has(selectedFile);
  const DEFAULT_EDITOR_SIZE = 100 - DEFAULT_TERMINAL_SIZE;

  return (
    <>
      <Toaster />
      <motion.div
        initial="closed"
        animate="open"
        className={`col-span-8 bg-gray-100 dark:bg-gray-800 rounded-lg h-full ${
          initializingProject ? "hidden" : "block"
        }`}
      >
        <div className="flex items-center justify-between px-2 pt-2 pb-2 pr-6 rounded-t-lg">
          {/* Tab Switch Buttons */}
          <div className="flex items-center rounded-3xl space-x-1 h-8 bg-primary-foreground max-w-fit px-1 py-3">
            <TabButton
              label="Code"
              isActive={currentTab === "code"}
              onClick={() => setCurrentTab("code")}
            />
            <TabButton
              label="Preview"
              isActive={currentTab === "preview"}
              onClick={() => setCurrentTab("preview")}
            />
          </div>
          <div className={`flex items-center gap-x-2`}>
            {/* Deploy Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!deployingTo || !currentProjectId || isStreaming}
                >
                  {deployingTo ? `Deploying to ${deployingTo}...` : "Deploy"}
                  <MousePointerClick className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  disabled={!!deployingTo}
                  onClick={() => handleDeploy("netlify")}
                  className={`${!hasNetlifyToken && "cursor-not-allowed"}`}
                >
                  <img
                    className="w-5 h-5"
                    height="24"
                    width="24"
                    crossOrigin="anonymous"
                    loading="eager"
                    src="https://cdn.simpleicons.org/netlify"
                  />
                  <span className="mx-auto">
                    {!hasNetlifyToken
                      ? "No Netlify Account Connected"
                      : "Deploy to Netlify"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!!deployingTo}
                  onClick={() => handleDeploy("vercel")}
                  className={`${!hasVercelToken && "cursor-not-allowed"}`}
                >
                  <img
                    className="w-5 h-5 bg-black p-1 rounded"
                    height="24"
                    width="24"
                    crossOrigin="anonymous"
                    loading="eager"
                    src="https://cdn.simpleicons.org/vercel/white"
                    alt="vercel"
                  />
                  <span className="mx-auto">
                    {!hasVercelToken
                      ? "No Vercel Account Connected"
                      : "Deploy to Vercel"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* File Actions */}
            {currentTab === "code" && showFileActions && (
              <>
                <Button
                  variant={"ghost"}
                  size={"sm"}
                  className="text-xs h-8 hover:bg-gray-200 text-gray-500 dark:bg-gray-800"
                  onClick={async () => {
                    if (currentProjectId && selectedFile) {
                      const result = await saveModifiedFile(
                        currentProjectId,
                        selectedFile,
                        customFetch
                      );
                      if (result.success) {
                        toast.success("File saved successfully");
                      } else {
                        customToast(result?.error || "Failed to save file");
                      }
                    }
                  }}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  variant={"ghost"}
                  size={"sm"}
                  className="text-xs h-8 hover:bg-gray-200 text-gray-500 dark:bg-gray-800"
                  onClick={() => selectedFile && resetFile(selectedFile)}
                >
                  <History className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Animated Tab Content Container */}
        <div className="relative h-[calc(100%-2.5rem)] overflow-hidden">
          {/* Code Tab Content */}
          <motion.div
            key="code-tab"
            initial={{ x: currentTab === "code" ? 0 : "100%" }}
            animate={{ x: currentTab === "code" ? 0 : "-100%" }}
            transition={viewTransition}
            className={`absolute inset-0 ${
              currentTab === "code"
                ? "z-10 block overflow-hidden"
                : "z-0 hidden"
            }`}
          >
            <PanelGroup direction="vertical" className="h-full">
              <Panel
                defaultSize={showTerminal ? DEFAULT_EDITOR_SIZE : 100}
                minSize={30}
                className="overflow-hidden"
              >
                <FileExplorer readonly={isStreaming} />
              </Panel>
              <PanelResizeHandle className="h-[2px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" />
              <Panel
                defaultSize={DEFAULT_TERMINAL_SIZE}
                minSize={10}
                className="h-full"
              >
                <div className="h-full overflow-hidden">
                  <TerminalTabs readonly={isStreaming} />
                </div>
              </Panel>
            </PanelGroup>
          </motion.div>

          {/* Preview Tab Content */}
          <motion.div
            key="preview-tab"
            initial={{ x: currentTab === "preview" ? 0 : "100%" }}
            animate={{ x: currentTab === "preview" ? 0 : "100%" }}
            transition={viewTransition}
            className={`absolute inset-0 ${
              currentTab === "preview"
                ? "z-10 block overflow-hidden"
                : "z-0 hidden"
            }`}
          >
            <Preview />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
