import { mountFiles, parseActions, runCommand, startShell } from "@/lib/runtime";
import { devCommands, installCommands } from "@/lib/utils";
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
        webContainerInstance,
        terminal,
        setIframeURL
    } = useStore(
        useShallow(state => ({
            selectedFileName: state.selectedFileName,
            setSelectedFileName: state.setSelectedFileName,
            updateMessage: state.updateMessage,
            webContainerInstance: state.webContainerInstance,
            terminal: state.terminal,
            setIframeURL: state.setIframeURL
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

                if (lastStreamedAction && webContainerInstance) {
                    if (lastStreamedAction.type === 'file' && lastStreamedAction.state !== 'mounted') {
                        await mountFiles({ filePath: lastStreamedAction.filePath, content: lastStreamedAction.content }, webContainerInstance);
                        lastStreamedAction.state = 'mounted';
                    }
                    else if (lastStreamedAction.type === 'shell' && terminal
                        && lastStreamedAction.state !== 'running'
                        && lastStreamedAction.state !== 'completed'
                    ) {
                        const isInstallCommand = installCommands.some(command => command === lastStreamedAction.command);
                        const isDevCommand = devCommands.some(command => command === lastStreamedAction.command);
                        const commandArgs = lastStreamedAction.command.trim().split(' ');
                        if (isInstallCommand) {
                            await startShell(terminal, webContainerInstance);
                            lastStreamedAction.state = 'running';
                            const exitCode = await runCommand(webContainerInstance, terminal, commandArgs, true);
                            if (exitCode !== 0) {
                                lastStreamedAction.state = 'error';
                                throw new Error("Installation failed");
                            }
                            lastStreamedAction.state = 'completed';
                        }
                        else if (isDevCommand) {
                            lastStreamedAction.state = 'running';
                            const exitCode = await runCommand(webContainerInstance, terminal, commandArgs, false);
                            if (exitCode === null) {
                                lastStreamedAction.state = 'completed';
                                // TODO: Add a check to see if the server is ready
                                webContainerInstance.on('server-ready', (port, url) => {
                                    setIframeURL(url);
                                })
                            }
                            else {
                                lastStreamedAction.state = 'error';
                                throw new Error(`Failed to run command: ${lastStreamedAction.command}`);
                            }
                        }
                        else {
                            lastStreamedAction.state = 'running';
                            const exitCode = await runCommand(webContainerInstance, terminal, commandArgs, true);
                            if (exitCode !== 0) {
                                lastStreamedAction.state = 'error';
                                throw new Error(`Failed to run command: ${lastStreamedAction.command}`);
                            }
                            lastStreamedAction.state = 'completed';
                        }
                    }
                }

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