import { useFilesStore } from "@/store/filesStore";
import { FileIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

export function FileComponent({ name, filePath }: { name: string, filePath: string }) {
    const { selectedFile, setSelectedFile, isFileModified } = useFilesStore(
        useShallow(state => ({
            selectedFile: state.selectedFile,
            setSelectedFile: state.setSelectedFile,
            isFileModified: state.isFileModified
        }))
    );
    const isSelected = selectedFile === filePath;
    const isModified = isFileModified(filePath);

    return (
        <div
            className={`flex items-center gap-x-1 px-1 py-1 text-sm cursor-pointer 
                ${isSelected
                    ? "bg-sky-100 text-sky-700 dark:text-sky-400 dark:bg-sky-950"
                    : "hover:bg-gray-200 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:bg-zinc-700"}`
            }
            onClick={() => setSelectedFile(filePath)}
        >
            <FileIcon className="h-4" />
            {name}
            {isModified && (
                <div className="w-2 h-2 rounded-full bg-yellow-400 ml-1" />
            )}
        </div>
    );
}