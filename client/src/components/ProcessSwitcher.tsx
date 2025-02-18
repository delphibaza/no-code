import { Button } from "./ui/button";
import { usePreviewStore } from "@/store/previewStore";
import { useShallow } from "zustand/react/shallow";

export function ProcessSwitcher() {
    const { previews, activePreviewId, setActivePreviewId } = usePreviewStore(
        useShallow((state) => ({
            previews: state.previews,
            activePreviewId: state.activePreviewId,
            setActivePreviewId: state.setActivePreviewId
        }))
    );
    const previewList = Array.from(previews.values());

    if (!previewList.length) return null;

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-secondary">
            {previewList.map((preview) => (
                <Button
                    key={preview.id}
                    variant={activePreviewId === preview.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActivePreviewId(preview.id)}
                    className="flex items-center gap-2"
                >
                    {preview.port}
                </Button>
            ))}
        </div>
    );
}