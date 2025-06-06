import { cn } from "@/lib/utils";
import { useGeneralStore } from "@/stores/general";
import { FileItem } from "@repo/common/types";
import { AnimatePresence, motion } from "framer-motion";
import { FileTextIcon, Loader2, X } from "lucide-react";
import { memo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./ui/button";

interface UploadedFilesListProps {
  className?: string;
  onFilesChange?: (files: FileItem[]) => void;
}

export const UploadedFilesList = memo(function UploadedFilesList({
  className,
  onFilesChange,
}: UploadedFilesListProps) {
  const { attachments, setAttachments } = useGeneralStore(
    useShallow((state) => ({
      attachments: state.attachments,
      setAttachments: state.setAttachments,
    }))
  );

  const handleFileRemove = useCallback(
    (id: string) => {
      const fileToRemove = attachments.find((file) => file.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      const updatedFiles = attachments.filter((file) => file.id !== id);
      setAttachments(updatedFiles);
      onFilesChange?.(updatedFiles);
    },
    [attachments, setAttachments, onFilesChange]
  );

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-1", className)}>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {attachments.map((fileItem) => (
            <motion.div
              key={fileItem.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{
                duration: 0.2,
                layout: { duration: 0.15 },
              }}
              className="flex items-center gap-3 bg-background border rounded-lg shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1">
                {fileItem.uploading ? (
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : fileItem.preview ? (
                  <div className="h-10 w-10 rounded-md overflow-hidden border border-border/50">
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted">
                    <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div
                    className="font-medium text-xs text-foreground truncate max-w-[150px]"
                    title={fileItem.file.name}
                  >
                    {fileItem.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(fileItem.file.size)}
                    {fileItem.file.type && (
                      <span className="ml-1 opacity-70">
                        • {fileItem.file.type.split("/")[1]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0 mr-1"
                onClick={() => handleFileRemove(fileItem.id)}
                disabled={fileItem.uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});
