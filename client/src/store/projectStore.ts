import { ActionState, File, ParsedFiles, MessageHistory } from '@repo/common/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ProjectState {
    // messageId, message with json string
    messageHistory: MessageHistory[];
    // ParsedMessage with only files
    currentMessage: ParsedFiles | null;
    currentMessageId: string | null;
    // messageId, actions
    actions: Map<string, ActionState[]>;
    lastModified: number;
    selectedFile: string | null;

    // Actions
    upsertMessage: (message: MessageHistory) => void;
    setCurrentMessageId: (messageId: string) => void;
    addAction: (messageId: string, action: ActionState) => void;
    updateActionStatus: (actionId: string, status: ActionState['state']) => void;
    updateFile: (filePath: string, content: string) => void;
    setSelectedFile: (filePath: string | null) => void;
    initializeFiles: (templateFiles: File[]) => void;
    updateCurrentMessage: (message: ParsedFiles) => void;
}

export const useProjectStore = create<ProjectState>()(
    devtools(
        (set) => ({
            currentMessage: null,
            currentMessageId: null,
            actions: new Map(),
            lastModified: Date.now(),
            selectedFile: null,
            messageHistory: [],

            upsertMessage: (message) =>
                set((state) => {
                    const messages = [...state.messageHistory];
                    const index = messages.findIndex(m => m.id === message.id);
                    if (index !== -1) {
                        messages[index] = message;
                    } else {
                        messages.push(message);
                    }
                    return { messageHistory: messages };
                }),

            setCurrentMessageId: (messageId) =>
                set({ currentMessageId: messageId }),

            updateFile: (filePath, content) =>
                set((state) => {
                    if (!state.currentMessageId) {
                        return {
                            currentMessage: null
                        };
                    }
                    const currentMessage = state.currentMessage;
                    if (!currentMessage) {
                        return {
                            currentMessage: null
                        };
                    }
                    const newFiles = currentMessage.files.map(file =>
                        file.filePath === filePath ? {
                            ...file,
                            content: content,
                            timestamp: Date.now()
                        } : file
                    );
                    return {
                        currentMessage: {
                            ...currentMessage,
                            files: newFiles
                        },
                        lastModified: Date.now()
                    };
                }),

            setSelectedFile: (filePath) =>
                set({ selectedFile: filePath }),

            updateCurrentMessage: (message) =>
                set({ currentMessage: message }),

            addAction: (messageId, action) =>
                set((state) => {
                    const actions = new Map(state.actions);
                    const currentMessage = actions.get(messageId);
                    const newActions = currentMessage ? [...currentMessage, action] : [action];
                    actions.set(messageId, newActions);
                    return {
                        actions: actions,
                        lastModified: Date.now()
                    };
                }),

            updateActionStatus: (actionId, status) =>
                set((state) => {
                    const actions = new Map(state.actions);
                    if (!state.currentMessageId) {
                        return {
                            actions: state.actions
                        };
                    }
                    const currentMessage = actions.get(state.currentMessageId);
                    if (!currentMessage) {
                        return {
                            actions: state.actions
                        };
                    }
                    const newActions = currentMessage.map(action =>
                        action.id === actionId ? { ...action, state: status } : action
                    ) as ActionState[];
                    actions.set(state.currentMessageId, newActions);
                    return { actions };
                }),

            initializeFiles: (templateFiles) =>
                set(() => {
                    const fileActions = templateFiles.map((file, index) => ({
                        id: index.toString(),
                        timestamp: Date.now(),
                        type: 'file' as const,
                        filePath: file.filePath,
                        content: file.content,
                    }));

                    return {
                        currentMessage: {
                            initialContext: '',
                            files: fileActions,
                            endingContext: ''
                        },
                        lastModified: Date.now(),
                    };
                })
        }),
        { name: 'project-store' }
    )
) 