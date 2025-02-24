import { ChatInput } from "@/components/ChatInput";
import { TabsSwitch } from "@/components/TabsSwitch";
import { Workbench } from "@/components/Workbench";
import { useInitProject } from "@/hooks/useInitProject";
import { useMessageParser } from "@/hooks/useMessageParser";
import { API_URL } from "@/lib/constants";
import { constructMessages } from "@/lib/runtime";
import { useFilesStore } from "@/store/filesStore";
import { useGeneralStore } from "@/store/generalStore";
import { usePreviewStore } from "@/store/previewStore";
import { useProjectStore } from "@/store/projectStore";
import { useChat } from 'ai/react';
import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export default function ProjectInfo() {
    const params = useParams();
    const { terminal } = useGeneralStore(
        useShallow(state => ({
            terminal: state.terminal,
        }))
    );
    const { resetPreviews } = usePreviewStore(
        useShallow(state => ({
            resetPreviews: state.resetPreviews,
            webContainerInstance: state.webContainer
        }))
    );
    const { messageHistory,
        currentMessageId,
        upsertMessage,
        setCurrentMessageId,
        setCurrentProjectId,
        resetMessages,
    } = useProjectStore(
        useShallow(state => ({
            resetMessages: state.resetMessages,
            messageHistory: state.messageHistory,
            upsertMessage: state.upsertMessage,
            setCurrentProjectId: state.setCurrentProjectId,
            setCurrentMessageId: state.setCurrentMessageId,
            currentMessageId: state.currentMessageId
        }))
    );
    const { ignorePatterns, projectFiles, resetFilesStore } = useFilesStore(
        useShallow(state => ({
            resetFilesStore: state.resetFilesStore,
            projectFiles: state.projectFiles,
            ignorePatterns: state.ignorePatterns,
        }))
    );
    const { messages, input, setInput, error, isLoading, stop, reload, setMessages } = useChat({
        api: `${API_URL}/api/chat`,
        body: {
            projectId: params.projectId
        },
        sendExtraMessageFields: true,
        experimental_throttle: 100,
        // onFinish: (message, { usage, finishReason }) => {
        // console.log('Finished streaming message:', message);
        // console.log('Token usage:', usage);
        // console.log('Finish reason:', finishReason);
        // },
        onError: error => {
            console.error('An error occurred:', error);
            toast.error('There was an error processing your request');
        }
    });

    const { initializeProject, fetchingProjects } = useInitProject(setMessages, reload);

    useEffect(() => {
        if (!params.projectId) return;
        resetMessages();
        resetPreviews();
        resetFilesStore();
        setCurrentProjectId(params.projectId);
        if (terminal) {
            terminal.reset();
            initializeProject(params.projectId);
        }
    }, [params.projectId, terminal]);

    const handleNewMessage = useMessageParser();

    useEffect(() => {
        if (messages.length === 0) return;
        const recentMessage = messages.at(-1);
        if (recentMessage) {
            handleNewMessage(recentMessage);
        }
    }, [messages]);

    function handleSubmit() {
        upsertMessage({ id: crypto.randomUUID(), role: 'user', content: input, timestamp: Date.now() });
        if (!currentMessageId || !projectFiles.length) return;
        const newMessages = constructMessages(input, currentMessageId, projectFiles, messageHistory, ignorePatterns);
        setMessages(newMessages);
        reload();
        setCurrentMessageId(crypto.randomUUID());
        setInput('');
    }

    return (
        <>
            <Toaster />
            <div className="w-full px-2 pt-2 max-h-screen max-w-screen-2xl mx-auto grid grid-cols-12 gap-x-14">
                <div className="flex flex-col gap-y-3 col-span-4">
                    <Workbench />
                    <div>
                        <ChatInput
                            placeholder="How can we refine it..."
                            handleSubmit={handleSubmit}
                            input={input}
                            setInput={setInput}
                            isLoading={isLoading}
                            reload={reload}
                            stop={stop}
                            error={error}
                        />
                    </div>
                </div>
                <TabsSwitch />
            </div>
        </>
    );
}