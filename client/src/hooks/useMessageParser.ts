import { isNewFile, parseActions } from "@/lib/runtime";
import { actionExecutor } from "@/services/ActionExecutor";
import { useGeneralStore } from "@/store/generalStore";
import { useProjectStore } from "@/store/projectStore";
import { FileAction, ParsedMessage, ShellAction } from "@repo/common/types";
import type { Message } from "ai/react";
import { parse } from "best-effort-json-parser";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function useMessageParser(messages: Message[]) {
    const [streamingAction, setStreamingAction] = useState<FileAction | ShellAction | null>(null);
    const [lastStreamedAction, setLastStreamedAction] = useState<FileAction | ShellAction | null>(null);
    const { selectedFileName, setSelectedFileName } = useGeneralStore(
        useShallow(state => ({
            selectedFileName: state.selectedFileName,
            setSelectedFileName: state.setSelectedFileName,
        }))
    );
    const { upsertMessage,
        addAction,
        updateActionStatus,
        currentMessageId,
        updateCurrentMessage,
        currentMessage
    } = useProjectStore(
        useShallow(state => ({
            upsertMessage: state.upsertMessage,
            currentMessageId: state.currentMessageId,
            currentMessage: state.currentMessage,
            updateCurrentMessage: state.updateCurrentMessage,
            addAction: state.addAction,
            updateActionStatus: state.updateActionStatus,
        }))
    );

    const parseMessage = (message: Message) => {
        try {
            const startIndex = message.content.indexOf('{');
            if (startIndex === -1) return null;

            const trimmedJSON = message.content.slice(startIndex);
            const parsedData = parse(trimmedJSON);

            if (!parsedData?.artifact) return null;

            return {
                initialContext: parsedData.artifact.initialContext ?? '',
                actions: parseActions(parsedData.artifact.actions ?? []),
                endingContext: parsedData.artifact.endingContext ?? ''
            };
        } catch (error) {
            console.error('Failed to parse message:', error);
            return null;
        }
    };

    const updateStore = (parsedMessage: ParsedMessage,
        filteredActions: (FileAction | ShellAction)[]
    ) => {
        if (!currentMessage) {
            return;
        }
        const updatedFiles = [...currentMessage.files];
        const parsedFiles = filteredActions.filter(action => action.type === 'file');

        for (const parsedFile of parsedFiles) {
            const existingFileIndex = currentMessage.files.findIndex(existingFile =>
                existingFile.filePath === parsedFile.filePath
            );
            if (existingFileIndex !== -1) {
                updatedFiles[existingFileIndex].content = parsedFile.content;
            } else {
                updatedFiles.push(parsedFile);
            }
        }
        updateCurrentMessage({
            initialContext: parsedMessage.initialContext,
            files: updatedFiles,
            endingContext: parsedMessage.endingContext
        });
    }

    const handleLastStreamedAction = (
        endingContext: string | undefined,
        validActions: (FileAction | ShellAction)[]
    ) => {
        if (!endingContext) {
            const lastStreamedAction = validActions.at(-2);
            if (lastStreamedAction) {
                setLastStreamedAction({
                    ...lastStreamedAction,
                    id: (validActions.length - 2).toString()
                });
            }
        }
        else {
            const lastStreamedAction = validActions.at(-1);
            if (lastStreamedAction) {
                setLastStreamedAction({
                    ...lastStreamedAction,
                    id: (validActions.length - 1).toString()
                });
            }
        }
    }

    const handleStreamingAction = (validActions: (FileAction | ShellAction)[]) => {
        if (validActions.length > 0) {
            const streamingAction = validActions.at(-1);
            if (streamingAction) {
                setStreamingAction({
                    ...streamingAction,
                    id: (validActions.length - 1).toString()
                });
            }
        }
    }

    useEffect(() => {
        async function messageParser() {
            try {
                const lastMessage = messages.at(-1);
                if (!lastMessage || lastMessage.role !== "assistant" || !currentMessageId || !currentMessage) {
                    return;
                }
                upsertMessage({
                    id: currentMessageId,
                    role: 'assistant' as const,
                    content: lastMessage.content,
                    timestamp: Date.now()
                });
                const parsedMessage = parseMessage(lastMessage);
                if (!parsedMessage) {
                    return;
                }
                const validActions = parsedMessage.actions;
                updateStore(parsedMessage, validActions);
                handleStreamingAction(validActions);
                handleLastStreamedAction(parsedMessage?.endingContext, validActions);
            } catch (error) {
                console.error('An error occurred while parsing the message:', error as Error);
            }
        }
        messageParser()
    }, [messages]);

    useEffect(() => {
        if (!streamingAction || !currentMessageId || !currentMessage) {
            return;
        }
        if (streamingAction.type === 'file') {
            addAction(currentMessageId, {
                id: streamingAction.id,
                timestamp: streamingAction.timestamp,
                type: 'file',
                filePath: streamingAction.filePath,
                state: isNewFile(streamingAction.filePath, currentMessage.files) ? 'creating' : 'updating'
            });
        }
        if (streamingAction.type === 'file' && streamingAction.filePath !== selectedFileName) {
            // Get the file name from the file path
            const currentStreamingFileName = streamingAction.filePath.split('/').at(-1);
            if (currentStreamingFileName) {
                setSelectedFileName(currentStreamingFileName);
            }
        }
    }, [streamingAction?.id]);

    useEffect(() => {
        if (lastStreamedAction && currentMessageId && currentMessage) {
            if (lastStreamedAction.type === 'file') {
                updateActionStatus(
                    lastStreamedAction.id,
                    isNewFile(lastStreamedAction.filePath, currentMessage.files) ? 'created' : 'updated'
                );
            } else if (lastStreamedAction.type === 'shell') {
                addAction(currentMessageId, {
                    id: lastStreamedAction.id,
                    timestamp: lastStreamedAction.timestamp,
                    type: 'shell',
                    state: 'queued',
                    command: lastStreamedAction.command
                });
            }
            actionExecutor.addAction(lastStreamedAction);
        }
    }, [lastStreamedAction?.id]);

    return;
}