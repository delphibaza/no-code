import { usePreviewStore } from "@/stores/previews";
import { useShallow } from "zustand/react/shallow";
import { ProcessSwitcher } from "./ProcessSwitcher";

export function Preview() {
  const { activePreviewIndex, previews } = usePreviewStore(
    useShallow((state) => ({
      previews: state.previews,
      activePreviewIndex: state.activePreviewIndex,
    })),
  );
  const activePreview = previews[activePreviewIndex];

  if (!activePreview) {
    return (
      <div className="flex items-center justify-center h-full text-sm">
        No preview available!
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-sm bg-primary-foreground">
      <ProcessSwitcher />
      <iframe
        src={activePreview.baseUrl}
        className="flex-1 w-full h-full"
        title="preview"
        allow="cross-origin-isolated"
        loading="eager"
        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
      />
    </div>
  );
}
