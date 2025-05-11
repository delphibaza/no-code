import { parseActions } from "@/lib/runtime";
import { removeTrailingNewlines } from "@/lib/utils";
import { actionRunner } from "@/services/action-runner";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { useProjectStore } from "@/stores/project";
import { FileAction, ShellAction } from "@repo/common/types";
import type { Message } from "ai/react";
import { parse } from "best-effort-json-parser";
import { useRef, useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

export function useMessageParser() {
  // Use useRef instead of useState to avoid re-renders
  const processedActionIdsRef = useRef<Set<number>>(new Set());
  const lastProcessedContentRef = useRef<string>("");
  
  const { currentMessageId, upsertMessage, addAction, updateActionStatus } =
    useProjectStore(
      useShallow((state) => ({
        currentMessageId: state.currentMessageId,
        upsertMessage: state.upsertMessage,
        addAction: state.addAction,
        updateActionStatus: state.updateActionStatus,
      }))
    );
  const { selectedFile, setSelectedFile, updateProjectFiles } = useFilesStore(
    useShallow((state) => ({
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

  // Reset refs when currentMessageId changes
  useEffect(() => {
    processedActionIdsRef.current = new Set();
    lastProcessedContentRef.current = "";
  }, [currentMessageId]);

  const parseMessage = useCallback((content: string) => {
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
  }, []);

  const updateStore = useCallback((filteredActions: (FileAction | ShellAction)[]) => {
    const parsedFiles = filteredActions.filter(
      (action) => action.type === "file"
    );
    if (parsedFiles.length > 0) {
      updateProjectFiles(parsedFiles);
    }
  }, [updateProjectFiles]);

  const processFileAction = useCallback((action: FileAction, isLastAction: boolean) => {
    if (!currentMessageId || processedActionIdsRef.current.has(action.id)) {
      return;
    }
    
    // Mark this action as processed
    processedActionIdsRef.current.add(action.id);
    
    // Add the file action to the project store
    addAction(currentMessageId, {
      id: action.id,
      type: "file",
      filePath: action.filePath,
      state: isLastAction ? "created" : "creating",
    });
    
    // Set the selected file if it's different from the current one
    if (action.filePath !== selectedFile) {
      setSelectedFile(action.filePath);
    }
    
    // If this is the last action, update its status
    if (isLastAction) {
      updateActionStatus(currentMessageId, action.id, "created");
    }
  }, [currentMessageId, addAction, selectedFile, setSelectedFile, updateActionStatus]);

  const processShellAction = useCallback((action: ShellAction) => {
    if (!currentMessageId || processedActionIdsRef.current.has(action.id)) {
      return;
    }
    
    // Mark this action as processed
    processedActionIdsRef.current.add(action.id);
    
    // Add the shell action to the project store
    addAction(currentMessageId, {
      id: action.id,
      type: "shell",
      state: "queued",
      command: action.command,
    });
    
    // Add the action to the action runner
    actionRunner.addAction(currentMessageId, action);
  }, [currentMessageId, addAction]);

  const handleNewMessage = useCallback((message: Message) => {
    if (message.role !== "assistant" || !currentMessageId) {
      return;
    }
    
    const messageContent = message.content || "";
    // Skip processing empty messages
    if (messageContent.length <= 2) {
      return;
    }
    
    const startIndex = messageContent.indexOf("{");
    if (startIndex === -1) return;
    
    const trimmedJSON = removeTrailingNewlines(messageContent.slice(startIndex));
      
    // Only process if content has changed
    if (trimmedJSON === lastProcessedContentRef.current) {
      return;
    }
    
    lastProcessedContentRef.current = trimmedJSON;
    
    try {
      // Batch state updates to reduce re-renders
      const batchUpdates = () => {
        upsertMessage({
          id: currentMessageId,
          role: "assistant" as const,
          content: trimmedJSON,
          reasoning: message.reasoning,
          timestamp: Date.now(),
        });
        
        const parsedMessage = parseMessage(trimmedJSON);
        if (!parsedMessage) return;
        
        const validActions = parsedMessage.actions;
        setCurrentTab("code");
        updateStore(validActions);
        
        // Process each action
        if (validActions.length > 0) {
          const lastActionIndex = validActions.length - 1;
          
          validActions.forEach((action, index) => {
            const isLastAction = 
              (index === lastActionIndex && parsedMessage.actionsStreamed) || 
              (index === lastActionIndex - 1 && !parsedMessage.actionsStreamed && validActions.length > 1);
            
            if (action.type === "file") {
              processFileAction(action, isLastAction);
            } else if (action.type === "shell") {
              if (isLastAction || parsedMessage.actionsStreamed) {
                processShellAction(action);
              }
            }
          });
        }
      };

      // Execute batch updates
      batchUpdates();
    } catch (error) {
      console.error("An error occurred while parsing the message:", error);
    }
  }, [currentMessageId, upsertMessage, parseMessage, setCurrentTab, updateStore, processFileAction, processShellAction]);
  
  return { handleNewMessage };
}
