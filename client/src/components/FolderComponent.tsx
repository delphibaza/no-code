import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function FolderComponent({ name, children }: { name: string; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <div
                className="flex items-center gap-x-1 mb-1 px-1 py-1 text-sm cursor-pointer rounded-sm hover:bg-gray-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                <ChevronRight className={`h-4 transform ${isOpen ? "rotate-90" : ""}`} />
                {name}
            </div>
            {isOpen && <div className="pl-3">{children}</div>}
        </div>
    );
}