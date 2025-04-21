import { projectFilesMsg } from "@/lib/prompts";
import { constructMessages } from "@/lib/runtime";
import { useFilesStore } from "@/stores/files";
import { useProjectStore } from "@/stores/project";
import { Message } from "ai/react";
import { useShallow } from "zustand/react/shallow";

export function useHandleSubmit(
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
  ) => void,
  reload: () => Promise<string | null | undefined>,
  setInput: React.Dispatch<React.SetStateAction<string>>
) {
  const {
    currentMessageId,
    messageHistory,
    currentProjectState,
    upsertMessage,
    setCurrentMessageId,
  } = useProjectStore(
    useShallow((state) => ({
      currentMessageId: state.currentMessageId,
      messageHistory: state.messageHistory,
      currentProjectState: state.currentProjectState,
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

  function handleSend(input: string) {
    upsertMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    });
    if (!currentMessageId || !projectFiles.length) return;
    if (currentProjectState === "blankTemplate") {
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
      setMessages(messages);
    } else {
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

  return { handleSend };
}
