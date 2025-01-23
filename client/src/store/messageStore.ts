import { ActionHistory, ActionState } from "@repo/common/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface MessageState {
    actions: ActionHistory[];
    // streamingFileName: string | null;

    // Actions
    // addMessage: (message: Message) => void;
    addAction: (action: ActionState) => void;
    updateActionStatus: (actionId: number, action: ActionState) => void;
    // setStreamingFileName: (fileName: string | null) => void;
}

export const useMessageStore = create<MessageState>()(
    devtools(
        (set) => ({
            // messages: [],
            actions: [],
            // streamingFileName: null,

            // addMessage: (message) =>
            //     set((state) => ({
            //         messages: [...state.messages, message]
            //     })),

            // addAction: (messageId, action) =>
            addAction: (action) =>
                set((state) => ({
                    actions: [...state.actions, {
                        actionId: state.actions.length + 1,
                        ...action,
                        timestamp: Date.now(),
                    }]
                })),

            updateActionStatus: (actionId, action) =>
                set((state) => ({
                    actions: state.actions.map(prevAction =>
                        prevAction.actionId === actionId
                            ? { actionId, ...action, timestamp: Date.now() }
                            : prevAction
                    )
                })),

            // setStreamingFileName: (fileName) =>
            //     set({ streamingFileName: fileName })
        }),
        { name: 'message-store' }
    )
)