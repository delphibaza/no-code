import { usePreviewStore } from "@/store/previewStore";
import { ChevronDown, ChevronUp, Unplug } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./ui/button";

export function ProcessSwitcher() {
    const [isExpanded, setIsExpanded] = useState(false);
    const { previews, activePreviewId, setActivePreviewId } = usePreviewStore(
        useShallow((state) => ({
            previews: state.previews,
            activePreviewId: state.activePreviewId,
            setActivePreviewId: state.setActivePreviewId
        }))
    );
    const previewList = Array.from(previews.values());
    const activePreview = previewList.find(p => p.id === activePreviewId);
    if (!previewList.length || !activePreview) return null;

    return (
        <div className="relative">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center rounded-md gap-2 text-muted-foreground hover:text-foreground"
            >
                <Unplug className="h-3 w-3" />
                <span className="text-xs">{activePreview.port}</span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            {isExpanded && (
                <div className="absolute top-full left-0 z-50 mt-1 w-32 rounded-md border bg-popover shadow-md">
                    <div className="text-sm font-bold px-3 py-2">Ports</div>
                    {previewList.map((preview) => (
                        <div
                            key={preview.id}
                            onClick={() => {
                                setActivePreviewId(preview.id);
                                setIsExpanded(false);
                            }}
                            className={`cursor-pointer px-3 py-2 text-sm ${activePreviewId === preview.id
                                ? "text-blue-500 font-medium"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                        >
                            <span className="text-xs">{preview.port}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}