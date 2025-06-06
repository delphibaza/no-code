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
import { CircleStop, CornerDownLeft, Loader, PaperclipIcon, WandSparkles } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { FileInputArea } from "./FileInputArea";
import { UploadedFilesList } from "./UploadedFilesList";
import { Button } from "./ui/button";

interface ButtonConfig {
  show: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
}

export const ChatInput = memo(
  ({
    input,
    isLoading,
    placeholder,
    stop,
    setInput,
    handleSubmit,
  }: {
    placeholder: string;
    input: string;
    isLoading: boolean;
    error?: Error | undefined;
    handleSubmit: (input: string) => void;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    reload?: () => Promise<string | null | undefined>;
    stop?: () => void;
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [enhancing, setEnhancing] = useState(false);
    const TEXTAREA_MIN_HEIGHT = 110;
    const TEXTAREA_MAX_HEIGHT = isLoading && stop ? 400 : 200;
    const { authenticatedFetch } = useFetch();

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
    ];

    const handleEnhancePrompt = useCallback(async () => {
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

        <div className="relative rounded-2xl transition-all">
          {/* File Input Area with Textarea */}
          <FileInputArea
            textareaRef={textareaRef}
            fileInputRef={fileInputRef}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            placeholder={placeholder}
            isLoading={isLoading}
            TEXTAREA_MIN_HEIGHT={TEXTAREA_MIN_HEIGHT}
            TEXTAREA_MAX_HEIGHT={TEXTAREA_MAX_HEIGHT}
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            {/* Attach files */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 hover:bg-muted/80"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Attach files (images, PDFs only)</p>
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

        {/* Uploaded Files List */}
        <UploadedFilesList />
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
