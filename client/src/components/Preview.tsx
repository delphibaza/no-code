import { usePreviewStore } from "@/store/previewStore";
import { useShallow } from "zustand/react/shallow";
import { ProcessSwitcher } from "./ProcessSwitcher";

export function Preview() {
    const { activePreview } = usePreviewStore(
        useShallow((state) => ({
            activePreview: state.activePreviewId
                ? state.previews.get(state.activePreviewId) ?? null
                : null,
        }))
    );

    if (!activePreview) {
        return (
            <div className="flex items-center justify-center h-full border-2 text-sm">
                No preview available!
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full rounded-sm bg-primary-foreground">
            <ProcessSwitcher />
            <iframe
                src={activePreview.baseUrl}
                className="flex-1 w-full border-t-2 h-full"
                title="preview"
            />
        </div>
    );
}