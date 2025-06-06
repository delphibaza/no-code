import { API_URL } from "@/lib/constants";
import { projectFilesMsg } from "@/lib/prompts";
import { constructMessages, processFiles } from "@/lib/runtime";
import { customToast } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { Message } from "@ai-sdk/react";
import { Attachment } from "@repo/common/types";
import { useShallow } from "zustand/react/shallow";
import useFetch from "./useFetch";

export function useHandleSubmit(
  setMessages: (messages: Message[]) => void,
  reload: () => Promise<string | null | undefined>,
  setInput: React.Dispatch<React.SetStateAction<string>>
) {
  const {
    currentMessageId,
    messageHistory,
    currentProjectId,
    upsertMessage,
    setCurrentMessageId,
  } = useProjectStore(
    useShallow((state) => ({
      currentProjectId: state.currentProjectId,
      currentMessageId: state.currentMessageId,
      messageHistory: state.messageHistory,
      upsertMessage: state.upsertMessage,
      setCurrentMessageId: state.setCurrentMessageId,
    }))
  );
  const { projectFiles, ignorePatterns } = useFilesStore(
    useShallow((state) => ({
      projectFiles: state.projectFiles,
      ignorePatterns: state.ignorePatterns,
    }))
  );
  const { attachments, setAttachments, setReasoning } = useGeneralStore(
    useShallow((state) => ({
      attachments: state.attachments,
      setAttachments: state.setAttachments,
      setReasoning: state.setReasoning,
    }))
  );
  const { authenticatedFetch } = useFetch();

  async function getProjectState() {
    const data = await authenticatedFetch(
      `${API_URL}/api/project-state/${currentProjectId}`
    );
    return data;
  }

  async function handleSend(input: string) {
    if (input.trim() === "") {
      customToast("Please enter a valid input");
      return;
    }
    upsertMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    });
    if (!currentMessageId || !projectFiles.length) return;
    setInput("");
    try {
      // Fetch project state
      const data = await getProjectState();
      if (data.state === "blankTemplate") {
        // Get the template prompt that was added earlier while initializing
        const templatePrompt = messageHistory.find(
          (message) => message.role === "data"
        )?.content;
        const messages = [
          {
            id: "1",
            role: "user" as const,
            content: projectFilesMsg(projectFiles, ignorePatterns),
          },
          ...(templatePrompt
            ? [
                { id: "2", role: "user" as const, content: templatePrompt },
                {
                  id: "3",
                  role: "user" as const,
                  // We are not using projectInstructionsMsg here
                  // because we don't need the commands from LLM
                  content: `YOUR CURRENT TASK: ${input}`,
                },
              ]
            : [
                {
                  id: "2",
                  role: "user" as const,
                  content: `YOUR CURRENT TASK: ${input}`,
                },
              ]),
        ];
        setReasoning(true);
        setMessages(messages);
      } else {
        setReasoning(false);
        const attachmentsToUpload: Attachment[] = [];
        if (attachments.length > 0) {
          const uploadedFiles = processFiles(attachments);
          attachmentsToUpload.push(...uploadedFiles);
        }
        const newMessages = constructMessages(
          input,
          currentMessageId,
          projectFiles,
          messageHistory,
          ignorePatterns,
          attachmentsToUpload
        );
        setMessages(newMessages);
      }
      reload();
      // Clear attachments
      setAttachments([]);
      setCurrentMessageId(crypto.randomUUID());
    } catch (error) {
      customToast(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  }

  return { handleSend };
}
