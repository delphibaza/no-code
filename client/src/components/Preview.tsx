import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePreviewStore } from "@/stores/previews";
import { reloadPreview } from "@webcontainer/api";
import {
  ChevronDown,
  ExternalLink,
  Monitor,
  RotateCw,
  Smartphone,
} from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export const Preview = memo(function Preview() {
  const { activePreviewIndex, previews, setActivePreviewIndex } =
    usePreviewStore(
      useShallow((state) => ({
        previews: state.previews,
        activePreviewIndex: state.activePreviewIndex,
        setActivePreviewIndex: state.setActivePreviewIndex,
      }))
    );

  const [isMobileMode, setIsMobileMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [displayPath, setDisplayPath] = useState("/");
  const activePreview = previews[activePreviewIndex];

  useEffect(() => {
    if (activePreview) {
      setDisplayPath("/");
    }
  }, [activePreview]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activePreview) {
      iframeRef.current?.setAttribute(
        "src",
        activePreview.baseUrl + displayPath
      );
    }
    // Handle empty path
    if (displayPath === "") {
      setDisplayPath("/");
    }
  };

  const handleOpenInNewTab = () => {
    if (activePreview) {
      window.open(activePreview.baseUrl + displayPath, "_blank");
    }
  };

  const handleRefresh = async () => {
    if (iframeRef.current) {
      await reloadPreview(iframeRef.current);
    }
  };

  if (!activePreview) {
    return (
      <div className="flex items-center justify-center h-full text-sm cursor-default">
        No preview available!
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-sm bg-background border">
      <div className="flex items-center gap-2 p-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="h-8 w-8"
          title="Refresh"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8 px-3"
            >
              <span>{activePreview.port}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <div className="text-xs font-medium px-2 py-1.5 text-muted-foreground">
              Ports
            </div>
            {previews.map((preview, index) => (
              <DropdownMenuItem
                key={preview.port}
                className={`text-sm ${
                  index === activePreviewIndex ? "font-medium text-primary" : ""
                }`}
                onClick={() => setActivePreviewIndex(index)}
              >
                {preview.port}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <form onSubmit={handleUrlSubmit} className="flex-1">
          <Input
            value={displayPath}
            onChange={(e) => setDisplayPath(e.target.value)}
            className="h-8 text-sm"
            placeholder="URL"
          />
        </form>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenInNewTab}
          className="h-8 w-8"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        <Button
          variant={isMobileMode ? "default" : "ghost"}
          size="icon"
          onClick={() => setIsMobileMode(!isMobileMode)}
          className="h-8 w-8"
          title="Toggle mobile mode"
        >
          {isMobileMode ? (
            <Smartphone className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 relative overflow-auto bg-muted/20 flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={activePreview.baseUrl}
          className={isMobileMode ? "h-full w-4/12" : "w-full h-full"}
          title="preview"
          allow="cross-origin-isolated"
          loading="eager"
          sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
        />
      </div>
    </div>
  );
});
