import { getFileIcon } from "@/lib/fileIcons";
import { cn } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { useShallow } from "zustand/react/shallow";

export function FileComponent({
  name,
  filePath,
}: {
  name: string;
  filePath: string;
}) {
  const { selectedFile, setSelectedFile, modifiedFiles } = useFilesStore(
    useShallow((state) => ({
      selectedFile: state.selectedFile,
      setSelectedFile: state.setSelectedFile,
      modifiedFiles: state.modifiedFiles,
    }))
  );
  const isSelected = selectedFile === filePath;
  const isModified = modifiedFiles.has(filePath);
  const FileIcon = getFileIcon(name);

  return (
    <div
      className={cn(
        "flex items-center gap-x-1.5 px-2 py-1 text-sm cursor-pointer",
        "transition-colors duration-150 ease-in-out",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      )}
      onClick={() => setSelectedFile(filePath)}
    >
      <FileIcon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{name}</span>
      {isModified && (
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-1 flex-shrink-0" />
      )}
    </div>
  );
}
