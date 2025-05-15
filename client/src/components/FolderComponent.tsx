import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/useFetch";
import { path } from "@/lib/path";
import { cn } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import {
  ChevronRight,
  FilePlus,
  FolderIcon,
  FolderOpenIcon,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";

// Enum to manage different input modes
enum InputMode {
  NONE,
  RENAME,
  NEW_FILE,
  NEW_FOLDER,
}

export const FolderComponent = memo(function FolderComponent({
  name,
  folderPath,
  children,
}: {
  name: string;
  folderPath: string;
  children: React.ReactNode;
}) {
  const {
    selectedFile,
    setSelectedFile,
    createFile,
    addFolder,
    renameFolder,
    deleteFolder,
  } = useFilesStore(
    useShallow((state) => ({
      selectedFile: state.selectedFile,
      setSelectedFile: state.setSelectedFile,
      createFile: state.createFile,
      addFolder: state.addFolder,
      renameFolder: state.renameFolder,
      deleteFolder: state.deleteFolder,
    }))
  );
  const { customFetch } = useFetch();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.NONE);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-open if a selected file is inside this folder
    if (selectedFile && selectedFile.startsWith(folderPath + path.sep)) {
      // Check if the selected file's directory is exactly this folderPath or a sub-directory
      const parentDir = path.dirname(selectedFile);
      if (
        parentDir === folderPath ||
        parentDir.startsWith(folderPath + path.sep)
      ) {
        setIsOpen(true);
      }
    }
  }, [selectedFile, folderPath]);

  useEffect(() => {
    if (inputMode !== InputMode.NONE && inputRef.current) {
      inputRef.current.focus();
      if (inputMode === InputMode.RENAME) {
        inputRef.current.select();
      }
    }
  }, [inputMode]);

  const handleAction = async () => {
    const currentInputValue = inputValue.trim();
    if (!currentInputValue) {
      setInputMode(InputMode.NONE);
      setInputValue("");
      return;
    }

    try {
      switch (inputMode) {
        case InputMode.RENAME:
          if (currentInputValue !== name) {
            const newPath = path.join(
              path.dirname(folderPath),
              currentInputValue
            );
            await renameFolder(folderPath, newPath, customFetch);
            toast.success(`Renamed to ${currentInputValue}`);
            // If a file inside the renamed folder was selected, update its path
            if (
              selectedFile &&
              selectedFile.startsWith(folderPath + path.sep)
            ) {
              const relativePath = selectedFile.substring(folderPath.length);
              setSelectedFile(newPath + relativePath);
            }
          }
          break;
        case InputMode.NEW_FILE: {
          const newFilePath = path.join(folderPath, currentInputValue);
          await createFile(newFilePath, customFetch);
          toast.success(`File ${currentInputValue} created`);
          setIsOpen(true); // Ensure folder is open to show the new file
          setSelectedFile(newFilePath); // Select the new file
          break;
        }
        case InputMode.NEW_FOLDER: {
          const newFolderPath = path.join(folderPath, currentInputValue);
          await addFolder(newFolderPath, customFetch);
          toast.success(`Folder ${currentInputValue} created`);
          setIsOpen(true); // Ensure folder is open
          break;
        }
      }
    } catch (error) {
      toast.error(
        `Failed to ${InputMode[inputMode].toLowerCase()}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
    setInputMode(InputMode.NONE);
    setInputValue("");
  };

  const handleDelete = async () => {
    try {
      await deleteFolder(folderPath, customFetch);
      toast.success(`Deleted folder ${name}`);
    } catch (error) {
      toast.error(
        `Failed to delete folder: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleAction();
    } else if (event.key === "Escape") {
      setInputMode(InputMode.NONE);
      setInputValue("");
    }
  };

  const handleBlur = () => {
    // Delay blur handling slightly to allow context menu clicks
    setTimeout(() => {
      if (inputMode !== InputMode.NONE) {
        handleAction();
      }
    }, 100);
  };

  const startInputMode = (mode: InputMode) => {
    setInputMode(mode);
    setInputValue(mode === InputMode.RENAME ? name : "");
    // Ensure folder is open when creating new items inside it
    if (mode === InputMode.NEW_FILE || mode === InputMode.NEW_FOLDER) {
      setIsOpen(true);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>
          {" "}
          {/* Wrap content in a div for the trigger */}
          <div
            className={cn(
              "group flex items-center gap-x-1.5 px-2 py-1 text-sm cursor-pointer",
              "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
              "transition-colors duration-150 ease-in-out",
              // Highlight if the folder itself or a file within it is selected
              selectedFile &&
                (selectedFile === folderPath ||
                  selectedFile.startsWith(folderPath + path.sep)) &&
                "bg-muted/60"
            )}
            onClick={() => inputMode === InputMode.NONE && setIsOpen(!isOpen)}
            onDoubleClick={() => startInputMode(InputMode.RENAME)}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
                isOpen && "rotate-90"
              )}
            />
            <div className="flex items-center gap-x-1.5 flex-1 min-w-0">
              {" "}
              {inputMode === InputMode.RENAME ? (
                <Input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className="h-6 px-1 py-0 text-sm border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1" // Added flex-1
                  onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up
                />
              ) : (
                <>
                  {isOpen ? (
                    <FolderOpenIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  ) : (
                    <FolderIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="truncate">{name}</span>
                </>
              )}
            </div>
          </div>
          {/* Container for potential inline input for new file/folder */}
          {(inputMode === InputMode.NEW_FILE ||
            inputMode === InputMode.NEW_FOLDER) &&
            isOpen && (
              <div className="pl-8 pr-2 py-0.5">
                {" "}
                {/* Indent similar to files/folders */}
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    inputMode === InputMode.NEW_FILE
                      ? "New file name..."
                      : "New folder name..."
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className="h-6 px-1 py-0 text-sm border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          {/* Render children */}
          <div
            className={cn(
              "pl-4 overflow-hidden transition-all duration-200 ease-in-out",
              isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {isOpen && children}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => startInputMode(InputMode.NEW_FILE)}
          disabled={inputMode !== InputMode.NONE}
        >
          <FilePlus className="mr-2 h-4 w-4" />
          <span>New File</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => startInputMode(InputMode.NEW_FOLDER)}
          disabled={inputMode !== InputMode.NONE}
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          <span>New Folder</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => startInputMode(InputMode.RENAME)}
          disabled={inputMode !== InputMode.NONE}
        >
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleDelete}
          className="text-red-600"
          disabled={inputMode !== InputMode.NONE}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Folder</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});
