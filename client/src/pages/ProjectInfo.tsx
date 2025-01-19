import { TabsSwitch } from "@/components/TabsSwitch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Workbench } from "@/components/Workbench";
import { useMessageParser } from "@/hooks/useMessageParser";
import { API_URL } from "@/lib/constants";
import { projectFilesMsg, projectInstructionsMsg } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import type { File, FileAction, ShellAction } from "@repo/common/types";
import type { WebContainer } from "@webcontainer/api";
import type { Terminal as Xterm } from "@xterm/xterm";
import { useChat } from 'ai/react';
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useLocation, useParams } from "react-router-dom";

export default function ProjectInfo() {
    const params = useParams();
    const location = useLocation();
    const { enhancedPrompt, templateFiles, templatePrompt } = location.state as {
        enhancedPrompt: string,
        templateFiles: File[],
        templatePrompt: string,
    };
    const { terminal, setDoneStreaming, updateMessage, setSelectedFileName, selectedFileName, webContainerInstance, setWebContainerInstance, setIframeURL } = useStore();
    const [streamingFileName, setStreamingFileName] = useState<string | null>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error, reload, append } = useChat({
        api: `${API_URL}/api/chat`,
        onFinish: (message, { usage, finishReason }) => {
            // console.log('Finished streaming message:', message);
            // console.log('Token usage:', usage);
            // console.log('Finish reason:', finishReason);
            setDoneStreaming(true);
        },
        onError: error => {
            console.error('An error occurred:', error);
        },
        onResponse: response => {
            // console.log('Received HTTP response from server:', response);
        },
        initialMessages: [
            { id: "1", role: 'user', content: projectFilesMsg(templateFiles) },
            { id: "2", role: 'user', content: templatePrompt },
            // { id: "3", role: 'user', content: projectInstructionsMsg(enhancedPrompt) }
        ]
    });

    useEffect(() => {
        append({ id: "3", role: 'user', content: projectInstructionsMsg(enhancedPrompt) })
    }, []);

    async function runCommand(webContainerInstance: WebContainer, terminal: Xterm, commands: string[]) {
        const process = await webContainerInstance.spawn(commands[0], commands.slice(1));
        process.output.pipeTo(
            new WritableStream({
                write(data) {
                    terminal.write(data);
                },
            })
        );
        const exitCode = await process.exit;
        return exitCode;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function parseActions(actions: any[]): (FileAction | ShellAction)[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return actions.map((action: any) => {
            if (action.type === 'file') {
                return {
                    type: 'file',
                    filePath: action.filePath || '',
                    content: action.content || '',
                } as FileAction;
            } else if (action.type === 'shell') {
                return {
                    type: 'shell',
                    command: action.command || '',
                } as ShellAction;
            }
            return null;
        })
            .filter(action => action !== null)
            .map((action, index, arr) => {
                if (index !== arr.length - 1) {
                    if (action.type === 'file') {
                        return { ...action, state: isNewFile(action.filePath) ? 'created' : 'updated' }
                    } else {
                        return { ...action, state: 'streaming' }
                    }
                }
                else {
                    if (action.type === "file") {
                        return { ...action, state: isNewFile(action.filePath) ? 'creating' : 'updating' }
                    } else {
                        return { ...action, state: 'streaming' }
                    }
                }
            })
    }

    useEffect(() => {
        useMessageParser()
    }, [messages]);

    useEffect(() => {
        if (streamingFileName && streamingFileName !== selectedFileName) {
            setSelectedFileName(streamingFileName);
        }
    }, [streamingFileName]);

    // if (isLoading) {
    //     return (
    //         <div className="min-h-screen w-full flex justify-center items-center">
    //             <Loader2 className="w-5 h-5 animate-spin" />
    //         </div>
    //     );
    // }
    //     function handleSubmit(input: string) {
    //         const filesFromState = StreamingMessageParser.filesMap.get("1234") ?? [];
    //         const updatedMessages: ChatMessage[] = [
    //             {
    //                 role: "user",
    //                 content: projectFilesMsg(filesFromState)
    //             },
    //             {
    //                 role: "user",
    //                 content: chatHistoryMsg()
    //             },
    //             {
    //                 role: "user",
    //                 content: `Previous Message #1:

    // ${templatePrompt}

    // (Assistant response omitted)`
    //             },
    //             {
    //                 role: "user",
    //                 content: `Previous Message #2:

    // ${enhancedPrompt}

    // (Assistant response below)`
    //             },
    //             {
    //                 role: "user",
    //                 content: `Assistant Response to Message #2:
    // ${rawResponse.current}`
    //             },
    //             {
    //                 role: "user",
    //                 content: `Current Message:

    // ${input}`
    //             }
    //         ]
    //     }
    return (
        <>
            <Toaster />
            <div className="flex w-full h-full justify-between p-10">
                <div className="flex flex-col gap-y-5">
                    <Workbench />
                    {/* {error && (
                        <>
                            <div>An error occurred.</div>
                            <button type="button" onClick={() => reload()}>
                                Retry
                            </button>
                        </>
                    )} */}
                    {/* {isLoading && (
                        <div>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <Button
                                disabled={!isLoading}
                                type="button"
                                onClick={() => stop()}>
                                Stop
                            </Button>
                        </div>
                    )} */}
                    {/* <button onClick={() => reload()} disabled={isLoading}>Regenerate</button> */}
                    <form onSubmit={handleSubmit}>
                        <Textarea
                            name="prompt"
                            value={input}
                            onChange={handleInputChange}
                            disabled={isLoading || error !== null}
                        />
                        <Button type="submit">Submit</Button>
                    </form>
                    {/* <Input placeholder="How can we refine it..." handleSubmit={handleSubmit} /> */}
                </div>
                <TabsSwitch />
            </div>
        </>
    );
}
