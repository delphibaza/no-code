import { AnimatePresence, motion } from "framer-motion";
import { File, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./ui/button";

export interface FileItem {
  id: string;
  file: File;
  preview?: string;
  uploading: boolean;
  error?: string;
}

interface FileUploadProps {
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  files: FileItem[];
  maxFiles?: number;
  accept?: string;
}

export function FileUpload({
  onFilesAdded,
  onFileRemove,
  files,
  maxFiles = 10,
  accept = "*",
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length <= maxFiles) {
        onFilesAdded(newFiles);
      }
      // Reset the input value to allow selecting the same file again
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      if (files.length + newFiles.length <= maxFiles) {
        onFilesAdded(newFiles);
      }
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept={accept}
        />

        <div className="flex flex-col items-center justify-center py-4">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            Drag files here or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload up to {maxFiles} files
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Uploaded Files</div>
          <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
            <AnimatePresence>
              {files.map((fileItem) => (
                <motion.div
                  key={fileItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group"
                >
                  <div className="flex items-center border rounded-md p-2 pr-8 bg-background shadow-sm">
                    {fileItem.uploading ? (
                      <Loader2 className="h-5 w-5 text-muted-foreground mr-2 animate-spin" />
                    ) : fileItem.preview ? (
                      <div className="h-10 w-10 rounded overflow-hidden mr-2 flex-shrink-0">
                        <img
                          src={fileItem.preview || "/placeholder.svg"}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center mr-2 flex-shrink-0">
                        {fileItem.file.type.startsWith("image/") ? (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <File className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium truncate max-w-[150px]">
                        {fileItem.file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(fileItem.file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      onClick={() => onFileRemove(fileItem.id)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                      disabled={fileItem.uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
