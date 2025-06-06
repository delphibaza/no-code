import { cn } from "@/lib/utils";
import { useGeneralStore } from "@/stores/general";
import { FileItem } from "@repo/common/types";
import { motion } from "framer-motion";
import { PaperclipIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Textarea } from "./ui/textarea";

interface FileInputAreaProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (input: string) => void;
  placeholder: string;
  isLoading: boolean;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
}
const rainbowVariants = {
  initial: {
    boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
  },
  animate: {
    boxShadow: [
      "0 0 15px rgba(255, 0, 0, 0.5)",
      "0 0 15px rgba(255, 165, 0, 0.5)",
      "0 0 15px rgba(255, 255, 0, 0.5)",
      "0 0 15px rgba(0, 255, 0, 0.5)",
      "0 0 15px rgba(0, 0, 255, 0.5)",
      "0 0 15px rgba(238, 130, 238, 0.5)",
      "0 0 15px rgba(255, 0, 0, 0.5)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};
export const FileInputArea = memo(function FileInputArea({
  textareaRef,
  fileInputRef,
  input,
  setInput,
  handleSubmit,
  placeholder,
  isLoading,
  TEXTAREA_MIN_HEIGHT,
  TEXTAREA_MAX_HEIGHT,
}: FileInputAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { attachments, setAttachments } = useGeneralStore(
    useShallow((state) => ({
      attachments: state.attachments,
      setAttachments: state.setAttachments,
    }))
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const fileItems: FileItem[] = newFiles.map((file) => {
        const id = crypto.randomUUID();
        const fileItem: FileItem = {
          id,
          file,
          uploading: false,
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        };

        return fileItem;
      });

      const updatedFiles = [...attachments, ...fileItems];
      setAttachments(updatedFiles);
    },
    [attachments, setAttachments]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files).filter(
          (file) =>
            file.type.startsWith("image/") || file.type === "application/pdf"
        );
        addFiles(newFiles);
        e.target.value = "";
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set isDragging to false if we're leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter(
          (file) =>
            file.type.startsWith("image/") || file.type === "application/pdf"
        );
        addFiles(newFiles);
      }
    },
    [addFiles]
  );

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf"
        multiple
      />

      {/* Main textarea container with drag and drop */}
      <div
        className={cn(
          "relative rounded-2xl transition-all",
          isDragging && "ring-2 ring-primary ring-offset-2"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag and drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <PaperclipIcon className="h-8 w-8 text-primary mb-2 mx-auto" />
              <p className="text-sm font-medium">Drop images or PDFs here</p>
              <p className="text-xs text-muted-foreground">
                Files will be attached to your message
              </p>
            </motion.div>
          </div>
        )}

        {/* Textarea with rainbow animation */}
        <motion.div
          variants={rainbowVariants}
          initial="initial"
          animate={isLoading ? "animate" : "initial"}
          className="rounded-2xl overflow-hidden"
        >
          <Textarea
            ref={textareaRef}
            className={cn(
              "relative rounded-2xl whitespace-pre-wrap bg-slate-50 dark:bg-gray-800 border-2",
              "transition-shadow duration-300",
              "focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
              "resize-none"
            )}
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(input);
              }
            }}
            style={{
              minHeight: TEXTAREA_MIN_HEIGHT,
              maxHeight: TEXTAREA_MAX_HEIGHT,
            }}
            translate="no"
          />
        </motion.div>
      </div>
    </div>
  );
});
