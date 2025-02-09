import { TabsSwitch } from "@/components/TabsSwitch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Workbench } from "@/components/Workbench";
import { getWebContainer } from "@/config/webContainer";
import { useMessageParser } from "@/hooks/useMessageParser";
import { API_URL } from "@/lib/constants";
import { constructMessages, mountFiles, startShell } from "@/lib/runtime";
import { projectFilesMsg, projectInstructionsMsg } from "@/lib/utils";
import { actionExecutor } from "@/services/ActionExecutor";
import { useGeneralStore } from "@/store/generalStore";
import { useProjectStore } from "@/store/projectStore";
import { Artifact, ExistingProject, File, FileAction, NewProject, ShellAction } from "@repo/common/types";
import { Message, useChat } from 'ai/react';
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export default function ProjectInfo() {
    const params = useParams();
    const { webContainerInstance,
        terminal,
        setWebContainerInstance,
        setShellProcess,
    } = useGeneralStore(
        useShallow(state => ({
            webContainerInstance: state.webContainerInstance,
            terminal: state.terminal,
            setShellProcess: state.setShellProcess,
            setWebContainerInstance: state.setWebContainerInstance
        }))
    );
    const { messageHistory,
        projectFiles,
        currentMessageId,
        ignorePatterns,
        updateProjectFiles,
        upsertMessage,
        addAction,
        setCurrentMessageId,
    } = useProjectStore(
        useShallow(state => ({
            messageHistory: state.messageHistory,
            projectFiles: state.projectFiles,
            ignorePatterns: state.ignorePatterns,
            updateProjectFiles: state.updateProjectFiles,
            upsertMessage: state.upsertMessage,
            addAction: state.addAction,
            setCurrentMessageId: state.setCurrentMessageId,
            currentMessageId: state.currentMessageId
        }))
    );
    const { messages, input, setInput, handleInputChange, isLoading, stop, error, reload, setMessages } = useChat({
        api: `${API_URL}/api/chat`,
        body: {
            projectId: params.projectId
        },
        sendExtraMessageFields: true,
        experimental_throttle: 100,
        // onFinish: (message, { usage, finishReason }) => {
        onFinish: () => {
            // console.log('Finished streaming message:', message);
            // console.log('Token usage:', usage);
            // console.log('Finish reason:', finishReason);
        },
        onError: error => {
            console.error('An error occurred:', error);
            toast.error('There was an error processing your request');
        },
        // onResponse: response => {
        // console.log('Received HTTP response from server:', response);
        // }
    });

    useEffect(() => {
        async function initializeProject() {
            try {
                const container = await getWebContainer();
                setWebContainerInstance(container);
                const response = await fetch(`${API_URL}/api/project/${params.projectId}`);
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.msg);
                }
                let files: File[] = [];
                if (result.type === 'existing') {
                    const { messages, projectFiles } = result as ExistingProject;
                    let index = 0;
                    messages.forEach(message => {
                        if (message.role === 'user') {
                            // For user messages, content is always { text: string }
                            const userContent = message.content as { text: string };
                            upsertMessage({
                                id: message.id,
                                role: message.role,
                                content: userContent.text,
                                timestamp: new Date(message.createdAt).getTime()
                            });
                        } else if (message.role === 'assistant') {
                            // For assistant messages, content is always Artifact
                            const isLastMessage = index === messages.length - 1;
                            const assistantContent = message.content as { artifact: Artifact };
                            upsertMessage({
                                id: message.id,
                                role: message.role,
                                content: JSON.stringify(assistantContent),
                                timestamp: new Date(message.createdAt).getTime()
                            });
                            assistantContent.artifact.actions.forEach(action => {
                                const currentAction: FileAction | ShellAction = {
                                    id: crypto.randomUUID(),
                                    timestamp: Date.now(),
                                    ...action
                                };
                                if (currentAction.type === 'file') {
                                    addAction(message.id, {
                                        id: currentAction.id,
                                        type: 'file',
                                        filePath: currentAction.filePath,
                                        timestamp: Date.now(),
                                        state: 'created',
                                    });
                                } else if (action.type === 'shell') {
                                    addAction(message.id, {
                                        id: currentAction.id,
                                        type: 'shell',
                                        command: currentAction.command,
                                        timestamp: Date.now(),
                                        state: isLastMessage ? 'queued' : 'completed',
                                    });
                                    if (isLastMessage) {
                                        setCurrentMessageId(message.id);
                                        actionExecutor.addAction(currentAction);
                                    }
                                }
                            });
                        }
                        index++;
                    });
                    files = [...projectFiles];
                    updateProjectFiles(projectFiles.map(file => ({
                        type: 'file',
                        ...file,
                    })));
                } else {
                    const { enhancedPrompt, templateFiles, templatePrompt, ignorePatterns } = result as NewProject;
                    const messages = [
                        { id: '1', role: 'user', content: projectFilesMsg(templateFiles, ignorePatterns) },
                        ...(templatePrompt
                            ? [
                                { id: '2', role: 'user', content: templatePrompt },
                                { id: '3', role: 'user', content: projectInstructionsMsg(enhancedPrompt) }
                            ]
                            : [{ id: '2', role: 'user', content: projectInstructionsMsg(enhancedPrompt) }]
                        )
                    ];
                    setMessages(messages as Message[]);
                    reload();
                    // Store template files in store
                    setCurrentMessageId(crypto.randomUUID());
                    upsertMessage({ id: crypto.randomUUID(), role: 'data', content: templatePrompt, timestamp: Date.now() });
                    updateProjectFiles((templateFiles as File[]).map(file => ({
                        id: crypto.randomUUID(),
                        type: 'file',
                        timestamp: Date.now(),
                        filePath: file.filePath,
                        content: file.content
                    })));
                    files = [...templateFiles];
                }
                await mountFiles(files, container);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Error while initializing project"
                toast.error(errorMessage)
            }
        }
        initializeProject();
    }, [params.projectId]);

    useEffect(() => {
        async function initializeShell() {
            if (!webContainerInstance || !terminal) return;
            try {
                const process = await startShell(terminal, webContainerInstance);
                setShellProcess(process);
            } catch (error) {
                console.error('Failed to initialize shell:', error);
                setShellProcess(null);
            }
        }
        initializeShell();
    }, [webContainerInstance, terminal]);

    const handleNewMessage = useMessageParser();

    useEffect(() => {
        if (messages.length === 0) return;
        const message = messages.at(-1);
        if (!message) return;
        handleNewMessage(message);
    }, [messages]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        upsertMessage({ id: crypto.randomUUID(), role: 'user', content: input, timestamp: Date.now() });
        if (!currentMessageId || !projectFiles.length) return;
        const newMessages = constructMessages(input, currentMessageId, projectFiles, messageHistory, ignorePatterns);
        setMessages(newMessages);
        reload();
        setCurrentMessageId(crypto.randomUUID());
        setInput('');
    }

    // if (isLoading) {
    //     return (
    //         <div className="min-h-screen w-full flex justify-center items-center">
    //             <Loader2 className="w-5 h-5 animate-spin" />
    //         </div>
    //     );
    // }
    return (
        <>
            <Toaster />
            <div className="w-full py-14 pl-12 pr-4 max-h-screen max-w-screen-2xl mx-auto grid grid-cols-12 gap-x-14">
                <div className="flex flex-col gap-y-5 col-span-4">
                    <Workbench />
                    {error && (
                        <>
                            <div>An error occurred.</div>
                            <Button type="button" onClick={() => reload()}>
                                Retry
                            </Button>
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
                    <Button onClick={() => reload()} disabled={isLoading}>Regenerate</Button>
                    <form onSubmit={handleSubmit}>
                        <Textarea
                            value={input}
                            placeholder="How can we refine it..."
                            onChange={handleInputChange}
                            // disabled={isLoading || error !== null}
                            disabled={isLoading}
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