import { isNewFile, parseActions } from "@/lib/runtime";
import { actionExecutor } from "@/services/ActionExecutor";
import { useProjectStore } from "@/store/projectStore";
import { useStore } from "@/store/useStore";
import { File, FileAction, ParsedFiles, ParsedMessage, ShellAction } from "@repo/common/types";
import type { Message } from "ai/react";
import { parse } from "best-effort-json-parser";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function useMessageParser(messages: Message[], templateFiles: File[]) {
    const [streamingAction, setStreamingAction] = useState<FileAction | ShellAction | null>(null);
    const [lastStreamedAction, setLastStreamedAction] = useState<FileAction | ShellAction | null>(null);
    const {
        selectedFileName,
        setSelectedFileName,
    } = useStore(
        useShallow(state => ({
            selectedFileName: state.selectedFileName,
            setSelectedFileName: state.setSelectedFileName,
        }))
    );
    const { addAction, updateActionStatus, currentMessageId, updateCurrentMessage } = useProjectStore(
        useShallow(state => ({
            currentMessageId: state.currentMessageId,
            updateCurrentMessage: state.updateCurrentMessage,
            addAction: state.addAction,
            updateActionStatus: state.updateActionStatus,
        }))
    );

    useEffect(() => {
        async function messageParser() {
            try {
                const lastMessage = messages.at(-1);
                if (!lastMessage || lastMessage.role !== "assistant" || currentMessageId) {
                    return;
                }
                const lastMessageJSON = lastMessage.content;
                const startIndex = lastMessageJSON.indexOf('{');
                if (startIndex === -1) {
                    return;
                }

                const trimmedJSON = lastMessageJSON.substring(startIndex);
                const parsedData = parse(trimmedJSON);

                if (!parsedData || !parsedData.artifact) {
                    return;
                }

                const parsedMessage: ParsedMessage = {
                    initialContext: parsedData.artifact.initialContext || '',
                    actions: parseActions(parsedData.artifact.actions || []),
                    endingContext: parsedData.artifact.endingContext || ''
                };
                const filteredActions = parsedMessage.actions.filter(action =>
                    action.type === 'file'
                        ? !!(action.type === 'file' && action.filePath && action.content)
                        : !!(action.type === 'shell' && action.command)
                );
                // TODO: merge this with the files in the template
                const parsedFiles: ParsedFiles = {
                    ...parsedMessage,
                    files: filteredActions.filter(action => action.type === 'file') as FileAction[]
                };

                updateCurrentMessage(parsedFiles);

                if (filteredActions.length > 0) {
                    const lastFile = filteredActions.at(-1);
                    if (lastFile) {
                        setStreamingAction(lastFile);
                    }
                }

                if (!parsedMessage.endingContext) {
                    const lastStreamedAction = parsedMessage.actions.at(-2);
                    if (lastStreamedAction) {
                        setLastStreamedAction(lastStreamedAction);
                    }
                }
                else {
                    const lastStreamedAction = parsedMessage.actions.at(-1);
                    if (lastStreamedAction) {
                        setLastStreamedAction(lastStreamedAction);
                    }
                }
            } catch (error) {
                console.error('An error occurred while parsing the message:', error as Error);
            }
        }
        messageParser()
    }, [messages]);

    useEffect(() => {
        if (streamingAction && currentMessageId) {
            if (streamingAction.type === 'file') {
                addAction(currentMessageId, {
                    ...streamingAction,
                    state: isNewFile(streamingAction.filePath, templateFiles) ? 'creating' : 'updating'
                });
            } else if (streamingAction.type === 'shell') {
                addAction(currentMessageId, {
                    ...streamingAction,
                    state: 'running'
                });
            }
        }
    }, [streamingAction?.id]);

    useEffect(() => {
        if (!streamingAction) {
            return;
        }
        if (streamingAction.type === 'file' && streamingAction.filePath !== selectedFileName) {
            const filePathParts = streamingAction.filePath.split('/');
            const currentStreamingFileName = filePathParts.at(-1);
            if (currentStreamingFileName) {
                setSelectedFileName(currentStreamingFileName);
            }
        }
    }, [streamingAction?.id]);

    useEffect(() => {
        if (streamingAction && streamingAction.type === 'file') {
            updateActionStatus(streamingAction.id, {
                ...streamingAction,
                state: isNewFile(streamingAction.filePath, templateFiles) ? 'creating' : 'updating'
            });
        }
    }, [streamingAction]);

    useEffect(() => {
        if (lastStreamedAction) {
            if (lastStreamedAction.type === 'file') {
                updateActionStatus(lastStreamedAction.id, {
                    ...lastStreamedAction,
                    state: isNewFile(lastStreamedAction.filePath, templateFiles) ? 'created' : 'updated'
                });
            }
            actionExecutor.addAction(lastStreamedAction);
        }
    }, [lastStreamedAction?.id]);

    return;
}