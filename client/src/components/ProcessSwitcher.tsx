import { usePreviewStore } from "@/store/previewStore";
import { Preview } from "@repo/common/types";
import { ChevronDown, ChevronUp, MonitorIcon, ServerIcon, Unplug } from "lucide-react";
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

    // Determine if a preview is frontend or backend based on its path
    const getPreviewType = (preview: Preview) => {
        if (preview.cwd.startsWith('/home/project/backend')) {
            return { type: 'backend', icon: <ServerIcon className="h-3 w-3" /> };
        } else if (preview.cwd.startsWith('/home/project/frontend')) {
            return { type: 'frontend', icon: <MonitorIcon className="h-3 w-3" /> };
        } else {
            return { type: 'app', icon: <Unplug className="h-3 w-3" /> };
        }
    };

    const activePreviewType = getPreviewType(activePreview);

    return (
        <div className="relative">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center rounded-md gap-2 text-muted-foreground hover:text-foreground"
            >
                {activePreviewType.icon}
                <span className="text-xs capitalize">
                    {activePreviewType.type === 'app'
                        ? `Port ${activePreview.port}`
                        : `${activePreviewType.type} (${activePreview.port})`}
                </span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            {isExpanded && (
                <div className="absolute top-full left-0 z-50 mt-1 w-40 rounded-md border bg-popover shadow-md">
                    <div className="text-sm font-bold px-3 py-2">Available Servers</div>
                    {previewList.map((preview) => {
                        const previewType = getPreviewType(preview);
                        return (
                            <div
                                key={preview.id}
                                onClick={() => {
                                    setActivePreviewId(preview.id);
                                    setIsExpanded(false);
                                }}
                                className={`cursor-pointer px-3 py-2 text-sm flex items-center gap-2 ${activePreviewId === preview.id
                                    ? "text-blue-500 font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                            >
                                {previewType.icon}
                                <span className="text-xs capitalize">
                                    {previewType.type === 'app'
                                        ? `Port ${preview.port}`
                                        : `${previewType.type} (${preview.port})`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}