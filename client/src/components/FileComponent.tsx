import { useGeneralStore } from "@/store/generalStore";
import { FileIcon } from "lucide-react";

export function FileComponent({ name }: { name: string }) {
    const isSelected = useGeneralStore((state) => state.selectedFileName) === name;
    const setSelectedFileName = useGeneralStore((state) => state.setSelectedFileName);

    return (
        <div
            className={`flex items-center gap-x-1 px-1 py-1 text-sm cursor-pointer 
                ${isSelected ? "bg-sky-200" : "hover:bg-gray-200"}`
            }
            onClick={() => setSelectedFileName(name)}
        >
            <FileIcon className="h-4" />
            {name}
        </div>
    );
}