import { useState } from "react";
import { ChevronRight, FolderIcon, FolderOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FolderComponent({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-x-1.5 px-2 py-1 text-sm cursor-pointer",
          "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
          "transition-colors duration-150 ease-in-out"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
            isOpen && "rotate-90"
          )}
        />
        <div className="flex items-center gap-x-1.5">
          {isOpen ? (
            <FolderOpenIcon className="h-4 w-4 text-amber-500" />
          ) : (
            <FolderIcon className="h-4 w-4 text-amber-500" />
          )}
          <span className="truncate">{name}</span>
        </div>
      </div>
      <div
        className={cn(
          "pl-4 overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {isOpen && children}
      </div>
    </div>
  );
}
