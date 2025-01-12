import { FileExplorer } from "@/components/FileExplorer";
import { Input } from "@/components/Input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Workbench } from "@/components/Workbench";
import { useMessageParser } from "@/hooks/useMessageParser";
import { API_URL } from "@/lib/constants";
import { projectFilesMsg, projectInstructionsMsg } from "@/lib/utils";
import type { File } from "@repo/common/types";
import { useChat } from 'ai/react';
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
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
    const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error, reload, append } = useChat({
        api: `${API_URL}/api/chat`,
        experimental_throttle: 25,
        onFinish: (message, { usage, finishReason }) => {
            // console.log('Finished streaming message:', message);
            // console.log('Token usage:', usage);
            // console.log('Finish reason:', finishReason);
        },
        onError: error => {
            console.error('An error occurred:', error);
        },
        onResponse: response => {
            // console.log('Received HTTP response from server:', response);
        },
        streamProtocol: "text",
        initialMessages: [
            { id: "1", role: 'user', content: projectFilesMsg(templateFiles) },
            { id: "2", role: 'assistant', content: templatePrompt },
            // { id: "3", role: 'user', content: projectInstructionsMsg(enhancedPrompt) }
        ]
    });
    const { parsedMessages, parseMessages } = useMessageParser();

    useEffect(() => {
        parseMessages(messages, isLoading);
    }, [messages, isLoading, parseMessages]);
    useEffect(() => {
        append({ id: "3", role: 'user', content: projectInstructionsMsg(enhancedPrompt) })
    }, [])
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
                    {error && (
                        <>
                            <div>An error occurred.</div>
                            <button type="button" onClick={() => reload()}>
                                Retry
                            </button>
                        </>
                    )}
                    {isLoading && (
                        <div>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <Button
                                disabled={!isLoading}
                                type="button"
                                onClick={() => stop()}>
                                Stop
                            </Button>
                        </div>
                    )}
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
                <FileExplorer templateFiles={templateFiles} />
            </div>
        </>
    );
}
