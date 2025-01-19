import { useEffect } from "react";
import type { Message } from "ai/react";
import { parse } from "best-effort-json-parser";
import { ParsedMessage } from "@repo/common/types";

export function useMessageParser() {

    useEffect(() => {
        async function messageParser(messages: Message[]) {
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
                    actions: parseActions(parsedData.artifact.actions || []),
                    endingContext: parsedData.artifact.endingContext || ''
                };
                const lastStreamedAction = parsedMessage.actions.at(-2);
                console.log('Last streamed action:', lastStreamedAction);

                if (!webContainerInstance) {
                    const container = await getWebContainer();
                    const initialHierarchy = buildHierarchy(templateFiles);
                    const formattedFiles = formatFilesToMount(initialHierarchy);
                    await container.mount(formattedFiles)
                    setWebContainerInstance(container);
                }
                if (lastStreamedAction && webContainerInstance) {
                    if (lastStreamedAction.type === 'file') {
                        await webContainerInstance.fs.writeFile(lastStreamedAction.filePath, lastStreamedAction.content);
                    }
                    else if (lastStreamedAction.type === 'shell' && terminal) {
                        await startShell(terminal, webContainerInstance);

                        const commandArgs = lastStreamedAction.command.trim().split(' ');
                        const exitCode = await runCommand(webContainerInstance, terminal, commandArgs);

                        const isInstallCommand = installCommands.some(command => command === lastStreamedAction.command)
                        if (isInstallCommand && exitCode !== 0) {
                            throw new Error("Installation failed");
                        }
                        webContainerInstance.on('server-ready', (port, url) => {
                            setIframeURL(url);
                        })
                    }
                }

                updateMessage(lastMessage.id, parsedMessage);

                // Update selected file name if needed
                const fileActions = parsedMessage.actions.filter((action): action is FileAction =>
                    !!(action.type === 'file' && action.filePath && action.content)
                );

                if (fileActions.length > 0) {
                    const lastFile = fileActions[fileActions.length - 1];
                    const filePathParts = lastFile.filePath.split('/');
                    const newStreamingFileName = filePathParts.at(-1);
                    if (newStreamingFileName) {
                        setStreamingFileName(newStreamingFileName);
                    }
                }
            } catch (error) {
                console.error('An error occurred while parsing the message:', error as Error);
            }
        }
        messageParser()
    }, []);
}