import { FileIcon } from "lucide-react";

export function FileComponent({
    name,
    isSelected,
    onClick,
}: {
    name: string;
    isSelected: boolean;
    onClick: (name: string) => void;
}) {
    return (
        <div
            className={`flex rounded-sm items-center gap-x-1 px-1 py-1 text-sm cursor-pointer 
                ${isSelected ? "bg-sky-200" : "hover:bg-gray-200"}`
            }
            onClick={() => onClick(name)}
        >
            <FileIcon className="h-4" />
            {name}
        </div>
    );
}