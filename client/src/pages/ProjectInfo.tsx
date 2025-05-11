import ChatAlert from "@/components/ChatAlert";
import { ChatInput } from "@/components/ChatInput";
import { TabsSwitch } from "@/components/TabsSwitch";
import { BackgroundDots } from "@/components/ui/background-dots";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Workbench } from "@/components/Workbench";
import useFetch from "@/hooks/useFetch";
import { useHandleSubmit } from "@/hooks/useHandleSubmit";
import { useInitProject } from "@/hooks/useInitProject";
import { useMessageParser } from "@/hooks/useMessageParser";
import { API_URL } from "@/lib/constants";
import { cn, customToast } from "@/lib/utils";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { useChat } from "ai/react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export default function ProjectInfo() {
  const params = useParams();
  const { actionAlert, reasoning, setActionAlert, setCurrentTab } =
    useGeneralStore(
      useShallow((state) => ({
        actionAlert: state.actionAlert,
        reasoning: state.reasoning,
        setActionAlert: state.setActionAlert,
        setCurrentTab: state.setCurrentTab,
      }))
    );
  const { customFetch } = useFetch();
  const { refreshTokens, setCurrentProjectId, setRefreshTokens } =
    useProjectStore(
      useShallow((state) => ({
        refreshTokens: state.refreshTokens,
        setRefreshTokens: state.setRefreshTokens,
        setCurrentProjectId: state.setCurrentProjectId,
      }))
    );
  const {
    messages,
    input,
    error,
    isLoading,
    stop,
    setInput,
    reload,
    setMessages,
  } = useChat({
    api: `${API_URL}/api/chat`,
    body: {
      projectId: params.projectId,
      reasoning,
    },
    fetch: customFetch,
    sendExtraMessageFields: true,
    experimental_throttle: 100,
    onFinish: (_, { finishReason }) => {
      if (finishReason !== "stop") {
        customToast(
          "Token limit reached on our end. Please send a new request."
        );
      }
      setRefreshTokens(!refreshTokens);
    },
    onError: (error: Error) => {
      console.error("Chat error from server:", error);
      let displayMessage =
        "An error occurred while processing your request. Please try again.";

      if (error && error.message && typeof error.message === "string") {
        console.log("Raw error.message from server:", error.message);
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError && parsedError.msg) {
            displayMessage = parsedError.msg;
          } else {
            console.warn(
              "Parsed error from server, but 'msg' field was missing or malformed.",
              parsedError
            );
            // If JSON was valid but not our expected {msg: ...} format,
            // we could consider using error.message directly if it's short and simple.
            // For now, we'll stick to the generic message or the successfully parsed part if any.
          }
        } catch (e) {
          // JSON.parse failed, meaning error.message was not a valid JSON string.
          // It might be a plain text error message from the server or a network error.
          console.warn(
            "Failed to parse server error message as JSON. Raw message:",
            error.message,
            "Error during parsing:",
            e
          );
          // If error.message is a relatively short, non-HTML string, it might be intended for display.
          if (
            error.message.length < 150 &&
            !error.message.toLowerCase().includes("<html") &&
            !error.message.toLowerCase().includes("<!doctype")
          ) {
            displayMessage = error.message;
          }
        }
      } else {
        console.warn("Error object or error.message is missing or not a string.");
      }
      customToast(displayMessage);
    },
  });
  const [isWorkbenchCollapsed, setIsWorkbenchCollapsed] = useState(false);

  const { initializeProject, initializingProject } = useInitProject(
    setMessages,
    reload
  );
  const { handleSend } = useHandleSubmit(setMessages, reload, setInput);
  const { handleNewMessage } = useMessageParser();

  useEffect(() => {
    if (params.projectId) {
      setCurrentProjectId(params.projectId);
      initializeProject(params.projectId);
    }
  }, [params.projectId]);

  useEffect(() => {
    const recentMessage = messages.at(-1);
    if (recentMessage) {
      handleNewMessage(recentMessage);
      setTimeout(() => {
        setCurrentTab("code");
      }, 5000);
    }
  }, [messages]);

  if (initializingProject) {
    return (
      <div className="flex h-full md:h-[90vh] items-center justify-center">
        <Loader2 className="animate-spin size-5" />
      </div>
    );
  }

  const toggleWorkbench = () => {
    setIsWorkbenchCollapsed(!isWorkbenchCollapsed);
  };

  return (
    <BackgroundDots>
      <div className="w-full pr-2 pl-8 pt-2 h-full max-w-screen-2xl mx-auto flex gap-x-2">
        <motion.div
          className={cn(
            "flex flex-col gap-y-5 mr-4",
            isWorkbenchCollapsed ? "w-0 overflow-hidden" : "w-1/3"
          )}
          animate={{ width: isWorkbenchCollapsed ? 0 : "33.333%" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <Workbench />
          <div className="relative">
            {actionAlert && (
              <div className="absolute bottom-full left-0 w-full z-10">
                <ChatAlert
                  alert={actionAlert}
                  clearAlert={() => setActionAlert(null)}
                  postMessage={(message) => {
                    handleSend(message);
                    setActionAlert(null);
                  }}
                />
              </div>
            )}
            <ChatInput
              placeholder="How can we refine it..."
              handleSubmit={handleSend}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              reload={reload}
              stop={stop}
              error={error}
            />
          </div>
        </motion.div>

        <div className="flex items-center h-11/12">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer p-2 rounded-full"
                  onClick={toggleWorkbench}
                >
                  {isWorkbenchCollapsed ? (
                    <ChevronRight className="size-6 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronLeft className="size-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isWorkbenchCollapsed ? "Show workbench" : "Hide workbench"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <motion.div
          className="flex-1"
          animate={{
            width: isWorkbenchCollapsed ? "100%" : "66.667%",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <TabsSwitch isStreaming={isLoading} />
        </motion.div>
      </div>
    </BackgroundDots>
  );
}
