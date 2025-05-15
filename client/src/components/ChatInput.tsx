import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import { API_URL } from "@/lib/constants";
import { formatNumber } from "@/lib/formatterHelpers";
import { cn, customToast } from "@/lib/utils";
import { useProjectStore } from "@/stores/project";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleStop,
  CornerDownLeft,
  Loader,
  Loader2,
  PaperclipIcon,
  WandSparkles,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ButtonConfig {
  show: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
}

interface FileItem {
  id: string;
  file: File;
  preview?: string;
  uploading: boolean;
  error?: string;
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

export const ChatInput = memo(
  ({
    input,
    isLoading,
    stop,
    setInput,
    placeholder,
    handleSubmit,
  }: {
    placeholder: string;
    handleSubmit: (input: string) => void;
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    reload?: () => Promise<string | null | undefined>;
    stop?: () => void;
    error?: Error | undefined;
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { authenticatedFetch } = useFetch();
    const [enhancing, setEnhancing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<FileItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const TEXTAREA_MIN_HEIGHT = 110;
    const TEXTAREA_MAX_HEIGHT = isLoading && stop ? 400 : 200;

    const { subscriptionData, abortAllActions } = useProjectStore(
      useShallow((state) => ({
        subscriptionData: state.subscriptionData,
        abortAllActions: state.abortAllActions,
      }))
    );

    useEffect(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.style.height = "auto";

        const scrollHeight = textarea.scrollHeight;

        textarea.style.height = `${Math.min(
          scrollHeight,
          TEXTAREA_MAX_HEIGHT
        )}px`;
        textarea.style.overflowY =
          scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
      }
    }, [input, textareaRef]);

    const buttonConfigs: ButtonConfig[] = [
      {
        show: Boolean(!isLoading),
        icon: <CornerDownLeft className="size-4" />,
        onClick: () => handleSubmit(input),
        tooltip: "Send",
      },
      {
        show: Boolean(isLoading && stop),
        icon: <CircleStop className="size-4" />,
        onClick: stop
          ? () => {
              stop();
              abortAllActions();
            }
          : () => {},
        tooltip: "Stop",
      },
      // {
      //   show: Boolean(error && reload),
      //   icon: <RotateCcw className="size-4" />,
      //   onClick: reload || (() => {}),
      // },
    ];

    async function handleEnhancePrompt() {
      if (enhancing || !input) return;

      setEnhancing(true);
      try {
        const result = await authenticatedFetch(
          `${API_URL}/api/enhance-prompt`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: input }),
          }
        );
        setInput(result.enhancedPrompt);
      } catch (error) {
        customToast(
          error instanceof Error ? error.message : "Failed to enhance prompt"
        );
      } finally {
        setEnhancing(false);
      }
    }

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          addFiles(newFiles);
          // Reset the input value to allow selecting the same file again
          e.target.value = "";
        }
      },
      []
    );

    const addFiles = useCallback((newFiles: File[]) => {
      const fileItems: FileItem[] = newFiles.map((file) => {
        const id = crypto.randomUUID();
        const fileItem: FileItem = {
          id,
          file,
          uploading: true,
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        };

        // Simulate upload process
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, uploading: false } : item
            )
          );
        }, 1500);

        return fileItem;
      });

      setFiles((prev) => [...prev, ...fileItems]);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
      setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const newFiles = Array.from(e.dataTransfer.files);
          addFiles(newFiles);
        }
      },
      [addFiles]
    );

    const handleFileRemove = useCallback((id: string) => {
      setFiles((prev) => {
        const fileToRemove = prev.find((file) => file.id === id);
        if (fileToRemove?.preview) {
          URL.revokeObjectURL(fileToRemove.preview);
        }
        return prev.filter((file) => file.id !== id);
      });
    }, []);

    const activeButton = buttonConfigs.find((config) => config.show);

    return (
      <div className="relative">
        {/* Token Usage */}
        {subscriptionData && (
          <div className="absolute w-11/12 left-1/2 -translate-x-1/2 shadow-md shadow-sky-600/20 dark:shadow-sky-400/20 text-center -top-6 px-2 py-1 border border-gray-200 dark:border-gray-600 bg-background rounded-t-2xl text-xs">
            {formatNumber(
              subscriptionData.tokenUsage.daily.limit -
                subscriptionData.tokenUsage.daily.used
            )}{" "}
            daily tokens left out of{" "}
            {formatNumber(subscriptionData.tokenUsage.daily.limit)} tokens.
          </div>
        )}

        {/* File Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 p-2 border rounded-lg bg-background/50">
            <AnimatePresence>
              {files.map((fileItem) => (
                <motion.div
                  key={fileItem.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 bg-background border rounded-md px-2 py-1 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {fileItem.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : fileItem.preview ? (
                      <div className="h-5 w-5 rounded overflow-hidden">
                        <img
                          src={fileItem.preview || "/placeholder.svg"}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <span className="max-w-[120px] truncate">
                      {fileItem.file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(fileItem.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full p-0"
                    onClick={() => handleFileRemove(fileItem.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Input */}
        <div
          className={cn(
            "relative rounded-2xl transition-all",
            isDragging && "ring-2 ring-primary"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
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
                "focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
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

          {/* Drag and drop */}
          {isDragging && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <PaperclipIcon className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Drop files here to add to your message
                </p>
              </motion.div>
            </div>
          )}

          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            {/* Attach files */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Attach files</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Enhance prompt */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8",
                      enhancing
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-muted",
                      !input && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={enhancing || !input}
                    onClick={handleEnhancePrompt}
                  >
                    {enhancing ? (
                      <Loader className="size-4 animate-spin" />
                    ) : (
                      <WandSparkles className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Enhance prompt</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Active button */}
            {activeButton && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={activeButton.onClick}
                      className="h-8 w-8"
                    >
                      {activeButton.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{activeButton.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
