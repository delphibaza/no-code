import ChatAlert from "@/components/ChatAlert";
import { ChatInput } from "@/components/ChatInput";
import { TabsSwitch } from "@/components/TabsSwitch";
import { BackgroundDots } from "@/components/ui/background-dots";
import { Workbench } from "@/components/Workbench";
import useFetch from "@/hooks/useFetch";
import { useHandleSubmit } from "@/hooks/useHandleSubmit";
import { useInitProject } from "@/hooks/useInitProject";
import { useMessageParser } from "@/hooks/useMessageParser";
import { API_URL } from "@/lib/constants";
import { customToast } from "@/lib/utils";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { useChat } from "ai/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export default function ProjectInfo() {
  const params = useParams();
  const { actionAlert, reasoning, setActionAlert } = useGeneralStore(
    useShallow((state) => ({
      actionAlert: state.actionAlert,
      reasoning: state.reasoning,
      setActionAlert: state.setActionAlert,
    }))
  );
  const { customFetch } = useFetch();
  const { refreshTokens, setCurrentProjectId, setRefreshTokens } =
    useProjectStore(
      useShallow((state) => ({
        messageHistory: state.messageHistory,
        currentMessageId: state.currentMessageId,
        refreshTokens: state.refreshTokens,
        currentProjectState: state.currentProjectState,
        upsertMessage: state.upsertMessage,
        setRefreshTokens: state.setRefreshTokens,
        setCurrentProjectId: state.setCurrentProjectId,
        setCurrentMessageId: state.setCurrentMessageId,
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
    onFinish: async (_, { finishReason }) => {
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
    }
  }, [messages]);

  if (initializingProject) {
    return (
      <div className="flex h-full md:h-[90vh] items-center justify-center">
        <Loader2 className="animate-spin size-5" />
      </div>
    );
  }

  return (
    <BackgroundDots>
      <div className="w-full pr-2 pl-8 pt-2 h-full max-w-screen-2xl mx-auto grid grid-cols-12 gap-x-14">
        <div className="flex flex-col gap-y-5 col-span-4">
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
        </div>
        <TabsSwitch isStreaming={isLoading} />
      </div>
    </BackgroundDots>
  );
}
