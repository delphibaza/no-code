import ChatAlert from "@/components/ChatAlert";
import { ChatInput } from "@/components/ChatInput";
import { TabsSwitch } from "@/components/TabsSwitch";
import { BackgroundDots } from "@/components/ui/background-dots";
import { Workbench } from "@/components/Workbench";
import useFetch from "@/hooks/useFetch";
import { useInitProject } from "@/hooks/useInitProject";
import { useMessageParser } from "@/hooks/useMessageParser";
import { API_URL } from "@/lib/constants";
import { projectFilesMsg, projectInstructionsMsg } from "@/lib/prompts";
import { constructMessages } from "@/lib/runtime";
import { customToast } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { useChat } from "ai/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
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
  const {
    messageHistory,
    currentMessageId,
    currentProjectState,
    refreshTokens,
    upsertMessage,
    setCurrentMessageId,
    setCurrentProjectId,
    setRefreshTokens,
  } = useProjectStore(
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
  const { ignorePatterns, projectFiles } = useFilesStore(
    useShallow((state) => ({
      projectFiles: state.projectFiles,
      ignorePatterns: state.ignorePatterns,
    }))
  );
  const {
    messages,
    input,
    setInput,
    error,
    isLoading,
    stop,
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
    experimental_throttle: 50,
    onFinish: async (_, { finishReason }) => {
      if (finishReason !== "stop") {
        customToast(
          "An error occurred while processing your request. Please try again."
        );
        return;
      }
      setRefreshTokens(!refreshTokens);
    },
    onError: (error) => {
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

  useEffect(() => {
    if (params.projectId) {
      setCurrentProjectId(params.projectId);
      initializeProject(params.projectId);
    }
  }, [params.projectId]);

  const handleNewMessage = useMessageParser();

  useEffect(() => {
    if (messages.length === 0) return;
    const recentMessage = messages.at(-1);
    if (recentMessage) {
      handleNewMessage(recentMessage);
    }
  }, [messages]);

  function handleSubmit(input: string) {
    upsertMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    });
    // blank template projects do not have a currentMessageId yet
    // Since, they do not have any messages from user or assistant yet
    if (
      (currentProjectState !== "blankTemplate" && !currentMessageId) ||
      !projectFiles.length
    )
      return;
    if (currentProjectState === "blankTemplate") {
      // Get the template prompt that was added earlier while initializing
      const templatePrompt = messageHistory.find(
        (message) => message.role === "data"
      );
      if (!templatePrompt) return;
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: projectFilesMsg(projectFiles, ignorePatterns),
        },
        ...(templatePrompt
          ? [
              {
                id: "2",
                role: "user" as const,
                content: templatePrompt.content,
              },
              {
                id: "3",
                role: "user" as const,
                content: projectInstructionsMsg(input),
              },
            ]
          : [
              {
                id: "2",
                role: "user" as const,
                content: projectInstructionsMsg(input),
              },
            ]),
      ];
      setMessages(messages);
    } else {
      if (!currentMessageId) return;
      const newMessages = constructMessages(
        input,
        currentMessageId,
        projectFiles,
        messageHistory,
        ignorePatterns
      );
      setMessages(newMessages);
    }
    reload();
    setCurrentMessageId(crypto.randomUUID());
    setInput("");
  }

  return (
    <>
      <Toaster />
      <BackgroundDots>
        <div className="w-full pr-2 pl-8 pt-2 max-h-screen max-w-screen-2xl mx-auto grid grid-cols-12 gap-x-14">
          {initializingProject ? (
            <div className="flex col-span-12 h-full md:h-[90vh] items-center justify-center">
              <Loader2 className="animate-spin size-5" />
            </div>
          ) : (
            <div className="flex flex-col gap-y-5 col-span-4">
              <Workbench />
              <div className="flex-1 relative">
                {actionAlert && (
                  <div className="absolute bottom-full left-0 w-full z-10">
                    <ChatAlert
                      alert={actionAlert}
                      clearAlert={() => setActionAlert(null)}
                      postMessage={(message) => {
                        handleSubmit(message);
                        setActionAlert(null);
                      }}
                    />
                  </div>
                )}
                <ChatInput
                  placeholder="How can we refine it..."
                  handleSubmit={handleSubmit}
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  reload={reload}
                  stop={stop}
                  error={error}
                />
              </div>
            </div>
          )}
          <TabsSwitch
            initializingProject={initializingProject}
            isStreaming={isLoading}
          />
        </div>
      </BackgroundDots>
    </>
  );
}
