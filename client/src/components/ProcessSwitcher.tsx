import { usePreviewStore } from "@/stores/previews";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./ui/button";

export function ProcessSwitcher() {
    const [isExpanded, setIsExpanded] = useState(false);
    const { previews, activePreviewIndex, setActivePreviewIndex } = usePreviewStore(
        useShallow((state) => ({
            previews: state.previews,
            activePreviewIndex: state.activePreviewIndex,
            setActivePreviewIndex: state.setActivePreviewIndex
        }))
    );
    const previewList = Array.from(previews.values());
    const activePreview = previewList[activePreviewIndex];
    if (!previewList.length || !activePreview) return null;

    return (
        <div className="relative">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center rounded-md gap-2 text-muted-foreground hover:text-foreground"
            >
                <span className="text-xs">
                    {activePreview.port}
                </span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            {isExpanded && (
                <div className="absolute top-full left-0 z-50 mt-1 w-40 rounded-md border bg-popover shadow-md">
                    <div className="text-sm font-bold px-3 py-2">Available Servers</div>
                    {previewList.map((preview) => {
                        return (
                            <div
                                key={preview.port}
                                onClick={() => {
                                    setActivePreviewIndex(previewList.indexOf(preview));
                                    setIsExpanded(false);
                                }}
                                className={`cursor-pointer px-3 py-2 text-sm flex items-center gap-2 ${activePreviewIndex === previewList.indexOf(preview)
                                    ? "text-blue-500 font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                            >
                                <span className="text-xs">
                                    {preview.port}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}