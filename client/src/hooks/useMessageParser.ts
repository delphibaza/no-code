import { isNewFile, parseActions } from "@/lib/runtime";
import { removeTrailingNewlines } from "@/lib/utils";
import { actionRunner } from "@/services/action-runner";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { FileAction, ShellAction } from "@repo/common/types";
import type { Message } from "ai/react";
import { parse } from "best-effort-json-parser";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function useMessageParser() {
  const [streamingAction, setStreamingAction] = useState<
    FileAction | ShellAction | null
  >(null);
  const [lastStreamedAction, setLastStreamedAction] = useState<
    FileAction | ShellAction | null
  >(null);
  const {
    currentMessageId,
    upsertMessage,
    addAction,
    updateActionStatus,
    getActionStatus,
  } = useProjectStore(
    useShallow((state) => ({
      currentMessageId: state.currentMessageId,
      upsertMessage: state.upsertMessage,
      getActionStatus: state.getActionStatus,
      addAction: state.addAction,
      updateActionStatus: state.updateActionStatus,
    }))
  );
  const { selectedFile, projectFiles, updateProjectFiles, setSelectedFile } =
    useFilesStore(
      useShallow((state) => ({
        projectFiles: state.projectFiles,
        selectedFile: state.selectedFile,
        setSelectedFile: state.setSelectedFile,
        updateProjectFiles: state.updateProjectFiles,
      }))
    );
  const { setCurrentTab } = useGeneralStore(
    useShallow((state) => ({
      setCurrentTab: state.setCurrentTab,
    }))
  );

  const parseMessage = (content: string) => {
    try {
      const parsedData = parse(content);
      if (!parsedData?.artifact || !parsedData.artifact.actions) return null;
      return {
        actions: parseActions(parsedData.artifact.actions),
        actionsStreamed: !!parsedData.artifact?.endingContext,
      };
    } catch (error) {
      console.error("Failed to parse message:", error);
      return null;
    }
  };

  const updateStore = (filteredActions: (FileAction | ShellAction)[]) => {
    const updatedFiles = [...projectFiles];
    const parsedFiles = filteredActions.filter(
      (action) => action.type === "file"
    );

    for (const parsedFile of parsedFiles) {
      const existingFileIndex = projectFiles.findIndex(
        (existingFile) => existingFile.filePath === parsedFile.filePath
      );
      if (existingFileIndex !== -1) {
        updatedFiles[existingFileIndex].content = parsedFile.content;
      } else {
        updatedFiles.push(parsedFile);
      }
    }
    updateProjectFiles(updatedFiles);
  };

  const handleLastStreamedAction = (
    actionsStreamed: boolean,
    validActions: (FileAction | ShellAction)[]
  ) => {
    const lastStreamedAction = actionsStreamed
      ? validActions.at(-1)
      : validActions.at(-2);
    if (lastStreamedAction) {
      setLastStreamedAction(lastStreamedAction);
    }
  };

  const handleStreamingAction = (
    validActions: (FileAction | ShellAction)[]
  ) => {
    if (validActions.length > 0) {
      const streamingAction = validActions.at(-1);
      if (streamingAction) {
        setStreamingAction(streamingAction);
      }
    }
  };

  function handleNewMessage(message: Message) {
    if (message.role !== "assistant" || !currentMessageId) {
      return;
    }
    const startIndex = message.content.indexOf("{");
    const trimmedJSON =
      startIndex !== -1
        ? removeTrailingNewlines(message.content.slice(startIndex))
        : "";
    try {
      upsertMessage({
        id: currentMessageId,
        role: "assistant" as const,
        content: trimmedJSON,
        reasoning: message.reasoning,
        timestamp: Date.now(),
      });
      const parsedMessage = parseMessage(trimmedJSON);
      if (!parsedMessage) {
        return;
      }
      const validActions = parsedMessage.actions;
      setCurrentTab("code");
      updateStore(validActions);
      handleStreamingAction(validActions);
      handleLastStreamedAction(parsedMessage.actionsStreamed, validActions);
    } catch (error) {
      console.error(
        "An error occurred while parsing the message:",
        error as Error
      );
    }
  }

  useEffect(() => {
    if (!streamingAction || !currentMessageId || projectFiles.length === 0) {
      return;
    }
    if (streamingAction.type === "file") {
      addAction(currentMessageId, {
        id: streamingAction.id,
        type: "file",
        filePath: streamingAction.filePath,
        state: isNewFile(streamingAction.filePath, projectFiles)
          ? "creating"
          : "updating",
      });
    }
    if (
      streamingAction.type === "file" &&
      streamingAction.filePath !== selectedFile
    ) {
      setSelectedFile(streamingAction.filePath);
    }
  }, [streamingAction?.id]);

  useEffect(() => {
    if (lastStreamedAction && currentMessageId && projectFiles.length > 0) {
      if (lastStreamedAction.type === "file") {
        const prevStatus = getActionStatus(lastStreamedAction.id);
        updateActionStatus(
          currentMessageId,
          lastStreamedAction.id,
          prevStatus === "creating" || prevStatus === "created"
            ? "created"
            : "updated"
        );
      } else if (lastStreamedAction.type === "shell") {
        addAction(currentMessageId, {
          id: lastStreamedAction.id,
          type: "shell",
          state: "queued",
          command: lastStreamedAction.command,
        });
      }
      actionRunner.addAction(currentMessageId, lastStreamedAction);
    }
  }, [lastStreamedAction?.id]);

  return handleNewMessage;
}
