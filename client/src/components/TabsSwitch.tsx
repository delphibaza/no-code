import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHandleDeploy } from "@/hooks/useHandleDeploy";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { MousePointerClick, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { FileExplorer } from "./FileExplorer";
import { Preview } from "./Preview";
import { DEFAULT_TERMINAL_SIZE, TerminalTabs } from "./TerminalTabs";
import { Button } from "./ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";

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

export function TabsSwitch({ isStreaming }: { isStreaming: boolean }) {
  const { currentTab, showTerminal, setCurrentTab, setShowTerminal } =
    useGeneralStore(
      useShallow((state) => ({
        currentTab: state.currentTab,
        showTerminal: state.showTerminal,
        setCurrentTab: state.setCurrentTab,
        setShowTerminal: state.setShowTerminal,
      }))
    );
  const currentProjectId = useProjectStore(
    useShallow((state) => state.currentProjectId)
  );
  const { deployingTo, hasNetlifyToken, hasVercelToken, handleDeploy } =
    useHandleDeploy();
  const DEFAULT_EDITOR_SIZE = 100 - DEFAULT_TERMINAL_SIZE;

  return (
    <motion.div
      initial="closed"
      animate="open"
      className="w-full border bg-primary-foreground rounded-lg h-full"
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

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Terminal Toggle Button - Only show in code tab */}
          {currentTab === "code" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTerminal(!showTerminal)}
              title={showTerminal ? "Hide Terminal" : "Show Terminal"}
            >
              <Terminal className="h-4 w-4" />
            </Button>
          )}

          {/* Deploy Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex text-xs items-center space-x-2 py-1"
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
        </div>
      </div>

      <div className="relative h-[calc(100%-3.5rem)] overflow-hidden">
        {/* Code Tab Content */}
        <motion.div
          key="code-tab"
          initial={{ x: currentTab === "code" ? 0 : "100%" }}
          animate={{ x: currentTab === "code" ? 0 : "-100%" }}
          transition={viewTransition}
          className={`absolute inset-0 ${
            currentTab === "code" ? "z-10 block" : "z-0 hidden"
          }`}
        >
          <div className="h-full flex flex-col">
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel
                defaultSize={showTerminal ? DEFAULT_EDITOR_SIZE : 100}
                minSize={30}
                className="min-h-0"
              >
                <div className="h-full w-full overflow-hidden">
                  <FileExplorer readonly={isStreaming} />
                </div>
              </ResizablePanel>

              <ResizableHandle
                className={`h-[2px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 ${
                  showTerminal ? "block" : "hidden"
                }`}
              />
              <ResizablePanel
                defaultSize={DEFAULT_TERMINAL_SIZE}
                minSize={10}
                className={`min-h-0 ${showTerminal ? "block" : "hidden"}`}
              >
                <div className="h-full w-full overflow-hidden">
                  <TerminalTabs readonly={isStreaming} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
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
  );
}
