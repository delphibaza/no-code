import { TabsSwitch } from "@/components/TabsSwitch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Workbench } from "@/components/Workbench";
import { API_URL } from "@/lib/constants";
import { projectFilesMsg, projectInstructionsMsg } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import type { File } from "@repo/common/types";
import { useChat } from 'ai/react';
import { parse } from "best-effort-json-parser";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    const [files, setFiles] = useState<File[]>([]);
    const setStreamingDone = useStore((state) => state.setDoneStreaming);
    const selectedFileName = useStore((state) => state.selectedFileName);
    const setSelectedFileName = useStore((state) => state.setSelectedFileName);
    const [streamingFileName, setStreamingFileName] = useState<string | null>(null);
    const streamingNewFile = useRef(true);

    const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error, reload, append } = useChat({
        api: `${API_URL}/api/chat`,
        onFinish: (message, { usage, finishReason }) => {
            // console.log('Finished streaming message:', message);
            // console.log('Token usage:', usage);
            // console.log('Finish reason:', finishReason);
            setStreamingDone(true);
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

    useEffect(() => {
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
        if (!parsedData
            || !parsedData.artifact
            || !parsedData.artifact.actions
            || !Array.isArray(parsedData.artifact.actions)
            || parsedData.artifact.actions.length === 0
        ) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedFiles = parsedData.artifact.actions.filter((action: any) =>
            action?.type === 'file' &&
            action?.filePath !== undefined &&
            action?.content !== undefined
        );
        // Create a copy of templateFiles to avoid mutating the state directly
        const updatedFiles = [...templateFiles];

        if (parsedFiles.length > 0) {
            for (const file of parsedFiles) {
                const existingFileIndex = updatedFiles.findIndex((f) => f.filePath === file.filePath);
                if (existingFileIndex !== -1) {
                    updatedFiles[existingFileIndex] = { filePath: file.filePath, content: file.content };
                } else {
                    updatedFiles.push({ filePath: file.filePath, content: file.content });
                }
                const filePathParts = (file.filePath as string).split('/');
                const newStreamingFileName = filePathParts.at(-1);
                if (newStreamingFileName) {
                    setStreamingFileName(newStreamingFileName);
                    if (streamingNewFile.current) {
                        setSelectedFileName(newStreamingFileName);
                        streamingNewFile.current = false;
                    }
                }
            }
            setFiles(updatedFiles);
        }
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
                <TabsSwitch files={files} />
            </div>
        </>
    );
}
