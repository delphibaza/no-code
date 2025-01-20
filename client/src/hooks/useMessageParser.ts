import { parseActions } from "@/lib/runtime";
import { useStore } from "@/store/useStore";
import { File, FileAction, ParsedMessage } from "@repo/common/types";
import type { Message } from "ai/react";
import { parse } from "best-effort-json-parser";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function useMessageParser(messages: Message[], templateFiles: File[]) {
    const [streamingFileName, setStreamingFileName] = useState<string | null>(null);
    const {
        selectedFileName,
        setSelectedFileName,
        updateMessage,
    } = useStore(
        useShallow(state => ({
            selectedFileName: state.selectedFileName,
            setSelectedFileName: state.setSelectedFileName,
            updateMessage: state.updateMessage,
        }))
    )

    useEffect(() => {
        async function messageParser() {
            try {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage.role !== "assistant") {
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
                    actions: parseActions(parsedData.artifact.actions || [], templateFiles),
                    endingContext: parsedData.artifact.endingContext || ''
                };
                const lastStreamedAction = parsedMessage.actions.at(-2);

                updateMessage(lastMessage.id, parsedMessage);

                const fileActions = parsedMessage.actions.filter((action): action is FileAction =>
                    !!(action.type === 'file' && action.filePath && action.content)
                );

                if (fileActions.length > 0) {
                    const lastFile = fileActions.at(-1);
                    if (lastFile) {
                        const filePathParts = lastFile.filePath.split('/');
                        const newStreamingFileName = filePathParts.at(-1);
                        if (newStreamingFileName) {
                            setStreamingFileName(newStreamingFileName);
                        }
                    }
                }
            } catch (error) {
                console.error('An error occurred while parsing the message:', error as Error);
            }
        }
        messageParser()
    }, [messages]);

    useEffect(() => {
        if (streamingFileName && streamingFileName !== selectedFileName) {
            setSelectedFileName(streamingFileName);
        }
    }, [streamingFileName]);

    return;
}