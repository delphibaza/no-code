import { ActionState, MessageHistory, Project } from '@repo/common/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ProjectState {
    projects: Project[];
    currentProjectId: string | null;
    // messageId, message with json string
    messageHistory: MessageHistory[];
    // messageId, actions
    actions: Map<string, ActionState[]>;
    currentMessageId: string | null;

    // Actions
    setProjects: (projects: Project[]) => void;
    setCurrentProjectId: (projectId: string) => void;
    upsertMessage: (message: MessageHistory) => void;
    setCurrentMessageId: (messageId: string) => void;
    addAction: (messageId: string, action: ActionState) => void;
    getActionStatus: (actionId: string) => ActionState['state'] | null;
    updateActionStatus: (messageId: string, actionId: string, status: ActionState['state']) => void;
}

export const useProjectStore = create<ProjectState>()(
    devtools(
        (set, get) => ({
            currentMessageId: null,
            actions: new Map(),
            messageHistory: [],
            projects: [],
            currentProjectId: null,

            // Actions
            setProjects: (projects) =>
                set({ projects }),

            setCurrentProjectId: (projectId) =>
                set({ currentProjectId: projectId }),

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

            addAction: (messageId, action) =>
                set((state) => {
                    const actions = new Map(state.actions);
                    const currentMessage = actions.get(messageId);
                    const newActions = currentMessage ? [...currentMessage, action] : [action];
                    actions.set(messageId, newActions);
                    return {
                        actions: actions,
                    };
                }),

            getActionStatus: (actionId: string) => {
                const currentMessageId = get().currentMessageId;
                if (!currentMessageId) return null;

                return get().actions
                    .get(currentMessageId)
                    ?.find(action => action.id === actionId)
                    ?.state ?? null;
            },

            updateActionStatus: (messageId, actionId, status) =>
                set((state) => {
                    const actions = new Map(state.actions);
                    const currentMessage = actions.get(messageId);
                    if (!currentMessage) {
                        return {
                            actions: state.actions
                        };
                    }
                    const newActions = currentMessage.map(action =>
                        action.id === actionId ? { ...action, state: status } : action
                    ) as ActionState[];
                    actions.set(messageId, newActions);
                    return { actions };
                }),
        }),
        { name: 'project-store' }
    )
);