import { parseActions } from "@/lib/runtime";
import { removeTrailingNewlines } from "@/lib/utils";
import { actionRunner } from "@/services/action-runner";
import { useFilesStore } from "@/stores/files";
import { useProjectStore } from "@/stores/project";
import type { UIMessage } from "@ai-sdk/ui-utils";
import { FileAction, ShellAction } from "@repo/common/types";
import { parse } from "best-effort-json-parser";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

export function useMessageParser() {
  const processedActionIds = useRef<{
    storeAdded: Set<string | number>;
    finalized: Set<string | number>;
  }>({ storeAdded: new Set(), finalized: new Set() });
  const {
    currentMessageId,
    addAction,
    updateActionStatus,
    upsertMessageSources,
    upsertMessageContent,
    upsertMessageReasoning,
  } = useProjectStore(
    useShallow((state) => ({
      currentMessageId: state.currentMessageId,
      addAction: state.addAction,
      updateActionStatus: state.updateActionStatus,
      upsertMessageSources: state.upsertMessageSources,
      upsertMessageContent: state.upsertMessageContent,
      upsertMessageReasoning: state.upsertMessageReasoning,
    }))
  );
  const { selectedFile, setSelectedFile, updateProjectFiles } = useFilesStore(
    useShallow((state) => ({
      selectedFile: state.selectedFile,
      setSelectedFile: state.setSelectedFile,
      updateProjectFiles: state.updateProjectFiles,
    }))
  );

  useEffect(() => {
    console.log("Resetting processedActionIds due to currentMessageId change.");
    processedActionIds.current = {
      storeAdded: new Set(),
      finalized: new Set(),
    };
  }, [currentMessageId]);

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
    const parsedFiles = filteredActions.filter(
      (action) => action.type === "file"
    );
    updateProjectFiles(parsedFiles);
  };

  function handleNewMessage(message: UIMessage) {
    if (message.role !== "assistant" || !currentMessageId) {
      return;
    }
    message.parts.forEach((part) => {
      if (part.type === "reasoning") {
        upsertMessageReasoning(currentMessageId, part.reasoning);
      }
      if (part.type === "text") {
        try {
          const startIndex = part.text.indexOf("{");
          const trimmedJSON =
            startIndex !== -1
              ? removeTrailingNewlines(part.text.slice(startIndex))
              : "";
          upsertMessageContent(currentMessageId, trimmedJSON);
          const parsedMessage = parseMessage(trimmedJSON);
          if (!parsedMessage) {
            return;
          }
          const currentActions = parsedMessage.actions;
          const isStreamDone = parsedMessage.actionsStreamed;

          updateStore(currentActions);

          const currentProcessed = processedActionIds.current;

          currentActions.forEach((action, index) => {
            const isLastActionInCurrentStreamChunk =
              index === currentActions.length - 1;

            if (
              action.type === "file" &&
              !currentProcessed.storeAdded.has(action.id)
            ) {
              addAction(currentMessageId, {
                id: action.id,
                type: "file",
                filePath: action.filePath,
                state: "creating",
              });
              currentProcessed.storeAdded.add(action.id);
            }

            if (isLastActionInCurrentStreamChunk && action.type === "file") {
              if (action.filePath !== selectedFile) {
                setSelectedFile(action.filePath);
              }
            }
          });

          const actionsToFinalize = isStreamDone
            ? currentActions
            : currentActions.slice(0, -1);

          actionsToFinalize.forEach((action) => {
            if (!currentProcessed.finalized.has(action.id)) {
              if (action.type === "file") {
                if (!currentProcessed.storeAdded.has(action.id)) {
                  addAction(currentMessageId, {
                    id: action.id,
                    type: "file",
                    filePath: action.filePath,
                    state: "creating",
                  });
                  currentProcessed.storeAdded.add(action.id);
                }
                updateActionStatus(currentMessageId, action.id, "created");
              } else if (action.type === "shell") {
                if (!currentProcessed.storeAdded.has(action.id)) {
                  addAction(currentMessageId, {
                    id: action.id,
                    type: "shell",
                    state: "queued",
                    command: action.command,
                  });
                  currentProcessed.storeAdded.add(action.id);
                }
              }
              actionRunner.addAction(currentMessageId, action);
              currentProcessed.finalized.add(action.id);
            }
          });
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      }
      if (part.type === "source") {
        upsertMessageSources(currentMessageId, part.source);
      }
    });
  }

  return { handleNewMessage };
}
