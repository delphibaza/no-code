import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { webcontainer } from "@/config/webContainer";
import useFetch from "@/hooks/useFetch";
import { getFileIcon } from "@/lib/fileIcons";
import { path } from "@/lib/path";
import { cn } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { ClipboardCopy, Copy, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";

export function FileComponent({
  name,
  filePath,
}: {
  name: string;
  filePath: string;
}) {
  const {
    selectedFile,
    setSelectedFile,
    modifiedFiles,
    renameFile,
    deleteFile,
  } = useFilesStore(
    useShallow((state) => ({
      selectedFile: state.selectedFile,
      modifiedFiles: state.modifiedFiles,
      setSelectedFile: state.setSelectedFile,
      renameFile: state.renameFile,
      deleteFile: state.deleteFile,
    }))
  );
  const { customFetch } = useFetch();
  const isSelected = selectedFile === filePath;
  const isModified = modifiedFiles.has(filePath);
  const FileIcon = getFileIcon(name);

  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRename = async () => {
    if (newName && newName !== name) {
      const newPath = path.join(path.dirname(filePath), newName);
      try {
        await renameFile(filePath, newPath, customFetch);
        toast.success(`Renamed to ${newName}`);
      } catch (error) {
        toast.error(
          `Failed to rename: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setNewName(name); // Reset on error
      }
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    try {
      await deleteFile(filePath, customFetch);
      toast.success(`Deleted ${name}`);
    } catch (error) {
      toast.error(
        `Failed to delete: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleRename();
    } else if (event.key === "Escape") {
      setIsRenaming(false);
      setNewName(name);
    }
  };

  const handleBlur = () => {
    // Delay blur handling slightly to allow context menu clicks
    setTimeout(() => {
      if (isRenaming) {
        handleRename();
      }
    }, 100);
  };

  const handleCopyRelativePath = () => {
    navigator.clipboard.writeText(filePath);
    toast.success("Relative path copied to clipboard");
  };

  const handleCopyAbsolutePath = async () => {
    const absolutePath = path.join((await webcontainer).workdir, filePath);
    navigator.clipboard.writeText(absolutePath);
    toast.success("Absolute path copied to clipboard");
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-x-1.5 px-2 py-1 text-sm cursor-pointer",
            "transition-colors duration-150 ease-in-out",
            isSelected
              ? "bg-accent text-accent-foreground"
              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            if (!isRenaming) {
              setSelectedFile(filePath);
            }
          }}
          onDoubleClick={() => {
            setIsRenaming(true);
            setNewName(name);
          }}
        >
          {isRenaming ? (
            <Input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="h-6 px-1 py-0 text-sm border-blue-500 focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up
            />
          ) : (
            <>
              <FileIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{name}</span>
              {isModified && (
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-1 flex-shrink-0" />
              )}
            </>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering div onClick
            setIsRenaming(true);
            setNewName(name);
          }}
          disabled={isRenaming}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem disabled={isRenaming} onClick={handleCopyAbsolutePath}>
          <ClipboardCopy className="mr-2 h-4 w-4" />
          Copy absolute path
        </ContextMenuItem>
        <ContextMenuItem disabled={isRenaming} onClick={handleCopyRelativePath}>
          <Copy className="mr-2 h-4 w-4" />
          Copy relative path
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
