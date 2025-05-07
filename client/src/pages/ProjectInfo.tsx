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
    experimental_throttle: 75,
    onFinish: (_, { finishReason }) => {
      if (finishReason !== "stop") {
        customToast(
          "Token limit reached on our end. Please send a new request."
        );
      }
      setRefreshTokens(!refreshTokens);
    },
    onError: (error) => {
      console.log(error);
      customToast(
        JSON.parse(error.message)?.msg ??
          "An error occurred while processing your request. Please try again."
      );
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
      }, 1500);
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
