import useFetch from "@/hooks/useFetch";
import { buildHierarchy } from "@/lib/formatterHelpers";
import { getLanguageFromFileExtension } from "@/lib/getLanguageExtension";
import { cn, customToast, findFileContent } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { Folders } from "@repo/common/types";
import {
  FileIcon,
  FolderIcon,
  GripVertical,
  History,
  Maximize2,
  Minimize2,
  Save,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";
import { CodeEditor } from "./CodeEditor";
import { FileComponent } from "./FileComponent";
import { FolderComponent } from "./FolderComponent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

function RenderStructure({ files }: { files: Folders[] }) {
  return (
    <div
      style={{ scrollbarWidth: "none" }}
      className="py-1 overflow-y-auto overflow-x-hidden h-full"
    >
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
              filePath={file.filePath ?? file.name}
            />
          );
        }
      })}
    </div>
  );
}

export function FileExplorer({ readonly }: { readonly: boolean }) {
  const {
    projectFiles,
    selectedFile,
    modifiedFiles,
    saveModifiedFile,
    resetFile,
  } = useFilesStore(
    useShallow((state) => ({
      projectFiles: state.projectFiles,
      selectedFile: state.selectedFile,
      modifiedFiles: state.modifiedFiles,
      saveModifiedFile: state.saveModifiedFile,
      resetFile: state.resetFile,
    }))
  );
  const currentProjectId = useProjectStore(
    useShallow((state) => state.currentProjectId)
  );
  const currentTab = useGeneralStore(useShallow((state) => state.currentTab));
  const { customFetch } = useFetch();
  const folders = buildHierarchy(projectFiles);
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false);
  const [defaultLayout, setDefaultLayout] = useState([20, 80]);
  const showFileActions =
    currentTab === "code" && selectedFile && modifiedFiles.has(selectedFile);

  const toggleFileExplorer = () => {
    setIsFileExplorerCollapsed(!isFileExplorerCollapsed);
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-2 py-1.5 flex-shrink-0">
        <div className="flex items-center gap-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={toggleFileExplorer}
                >
                  {isFileExplorerCollapsed ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isFileExplorerCollapsed
                  ? "Expand file explorer"
                  : "Collapse file explorer"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-x-1.5 text-sm font-medium">
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
            <span>Explorer</span>
            {selectedFile && modifiedFiles.has(selectedFile) && (
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
            )}
          </div>
        </div>

        {/* Save and Reset */}
        {currentTab === "code" && showFileActions && (
          <div>
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
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full"
          onLayout={(sizes) => {
            setDefaultLayout(sizes);
          }}
        >
          <ResizablePanel
            defaultSize={defaultLayout[0]}
            minSize={15}
            maxSize={40}
            className={cn(
              "bg-background transition-all duration-300 ease-in-out",
              isFileExplorerCollapsed && "hidden"
            )}
          >
            <div className="h-full overflow-hidden">
              <RenderStructure files={folders} />
            </div>
          </ResizablePanel>

          {!isFileExplorerCollapsed && (
            <ResizableHandle withHandle>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </ResizableHandle>
          )}

          <ResizablePanel
            defaultSize={defaultLayout[1]}
            className="flex flex-col"
          >
            {selectedFile ? (
              <>
                <div className="border-b bg-muted/20 px-3 py-1.5">
                  <Breadcrumb>
                    <BreadcrumbList className="flex-wrap">
                      {selectedFile.split("/").map((segment, index, array) => (
                        <BreadcrumbItem key={index}>
                          {index === array.length - 1 ? (
                            <span className="flex items-center gap-x-1.5">
                              <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{segment}</span>
                              {modifiedFiles.has(selectedFile) && (
                                <span className="text-xs text-muted-foreground">
                                  •
                                </span>
                              )}
                            </span>
                          ) : (
                            <>
                              <BreadcrumbLink className="text-xs text-muted-foreground hover:text-foreground">
                                {segment}
                              </BreadcrumbLink>
                              <BreadcrumbSeparator />
                            </>
                          )}
                        </BreadcrumbItem>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    code={findFileContent(projectFiles, selectedFile) ?? ""}
                    language={getLanguageFromFileExtension(selectedFile)}
                    readonly={readonly || !selectedFile || !projectFiles.length}
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-y-2 text-center max-w-md px-4">
                  <FileIcon className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium">No file selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a file from the explorer to view and edit its content
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
