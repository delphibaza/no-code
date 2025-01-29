import { isNewFile, parseActions } from "@/lib/runtime";
import { actionExecutor } from "@/services/ActionExecutor";
import { useGeneralStore } from "@/store/generalStore";
import { useProjectStore } from "@/store/projectStore";
import { File, FileAction, ParsedMessage, ShellAction } from "@repo/common/types";
import type { Message } from "ai/react";
import { parse } from "best-effort-json-parser";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
// Todo: template files should not be used to check if the file is new
export function useMessageParser(messages: Message[], templateFiles: File[]) {
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

    useEffect(() => {
        async function messageParser() {
            try {
                const lastMessage = messages.at(-1);
                if (!lastMessage || lastMessage.role !== "assistant" || !currentMessageId || !currentMessage) {
                    return;
                }
                upsertMessage(currentMessageId, {
                    timestamp: Date.now(),
                    role: 'assistant' as const,
                    content: lastMessage.content
                });
                const parsedMessage = parseMessage(lastMessage);

                if (!parsedMessage) {
                    return;
                }
                const validActions = parsedMessage.actions;
                updateStore(parsedMessage, validActions);

                if (validActions.length > 0) {
                    const streamingAction = validActions.at(-1);
                    if (streamingAction) {
                        setStreamingAction({
                            ...streamingAction,
                            id: (validActions.length - 1).toString()
                        });
                    }
                }

                if (!parsedMessage.endingContext) {
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
            } catch (error) {
                console.error('An error occurred while parsing the message:', error as Error);
            }
        }
        messageParser()
    }, [messages]);

    useEffect(() => {
        if (!streamingAction || !currentMessageId) {
            return;
        }
        if (streamingAction.type === 'file') {
            addAction(currentMessageId, {
                ...streamingAction,
                state: isNewFile(streamingAction.filePath, templateFiles) ? 'creating' : 'updating'
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
    // Todo: Account for queued actions, we are directly adding the action as a running action
    useEffect(() => {
        if (lastStreamedAction && currentMessageId) {
            if (lastStreamedAction.type === 'file') {
                updateActionStatus(lastStreamedAction.id, {
                    ...lastStreamedAction,
                    state: isNewFile(lastStreamedAction.filePath, templateFiles) ? 'created' : 'updated'
                });
            } else if (lastStreamedAction.type === 'shell') {
                addAction(currentMessageId, {
                    ...lastStreamedAction,
                    state: 'running'
                });
            }
            actionExecutor.addAction(lastStreamedAction);
        }
    }, [lastStreamedAction?.id]);

    return;
}