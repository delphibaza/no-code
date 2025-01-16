import { useStore } from "@/store/useStore";
import { FileIcon } from "lucide-react";

export function FileComponent({ name }: { name: string }) {
    const isSelected = useStore((state) => state.selectedFileName) === name;
    const setSelectedFileName = useStore((state) => state.setSelectedFileName);

    return (
        <div
            className={`flex rounded-sm items-center gap-x-1 px-1 py-1 text-sm cursor-pointer 
                ${isSelected ? "bg-sky-200" : "hover:bg-gray-200"}`
            }
            onClick={() => setSelectedFileName(name)}
        >
            <FileIcon className="h-4" />
            {name}
        </div>
    );
}