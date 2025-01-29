import { TabsSwitch } from "@/components/TabsSwitch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Workbench } from "@/components/Workbench";
import { getWebContainer } from "@/config/webContainer";
import { useMessageParser } from "@/hooks/useMessageParser";
import { API_URL } from "@/lib/constants";
import { mountFiles, startShell } from "@/lib/runtime";
import { projectFilesMsg, projectInstructionsMsg } from "@/lib/utils";
import { useProjectStore } from "@/store/projectStore";
import { useGeneralStore } from "@/store/generalStore";
import type { File } from "@repo/common/types";
import { useChat } from 'ai/react';
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useLocation, useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export default function ProjectInfo() {
    const params = useParams();
    const location = useLocation();
    const { enhancedPrompt, templateFiles, templatePrompt } = location.state as {
        enhancedPrompt: string,
        templateFiles: File[],
        templatePrompt: string,
    };
    const { webContainerInstance,
        terminal,
        setDoneStreaming,
        setWebContainerInstance,
        shellProcess,
        setShellProcess,
    } = useGeneralStore(
        useShallow(state => ({
            webContainerInstance: state.webContainerInstance,
            terminal: state.terminal,
            shellProcess: state.shellProcess,
            setShellProcess: state.setShellProcess,
            setDoneStreaming: state.setDoneStreaming,
            setWebContainerInstance: state.setWebContainerInstance
        }))
    );
    const { initializeFiles } = useProjectStore(
        useShallow(state => ({
            initializeFiles: state.initializeFiles
        }))
    );

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

    useEffect(() => {
        async function initializeWebContainer() {
            try {
                const container = await getWebContainer();
                await mountFiles(templateFiles, container);
                setWebContainerInstance(container);
                initializeFiles(templateFiles);
            } catch (error) {
                console.error('An error occurred while initializing the web container:', error);
            }
        }
        if (!webContainerInstance) {
            initializeWebContainer();
        }
    }, [webContainerInstance, templateFiles]);

    useEffect(() => {
        async function initializeShell() {
            if (!webContainerInstance || !terminal || shellProcess) return;
            try {
                const shellProcess = await startShell(terminal, webContainerInstance);
                setShellProcess(shellProcess);
            } catch (error) {
                console.error('Failed to initialize shell:', error);
                setShellProcess(null);
            }
        }
        initializeShell();
    }, [webContainerInstance, terminal]);

    useMessageParser(messages, templateFiles);

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
            <div className="w-full py-14 pl-12 pr-4 max-h-screen max-w-screen-2xl mx-auto grid grid-cols-12 gap-x-14">
                <div className="flex flex-col gap-y-5 col-span-4">
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
