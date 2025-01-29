import { useShallow } from "zustand/react/shallow"
import { ArtifactCard } from "./ArtifactCard"
import { useProjectStore } from "@/store/projectStore";

export function Workbench() {
    const { actions, messages } = useProjectStore(
        useShallow(state => ({
            actions: state.actions,
            messages: state.messages
        }))
    );
    
    return (
        <div style={{ scrollbarWidth: 'thin' }}
            className="h-[75vh] overflow-y-auto bg-gray-100 rounded-lg px-4 py-4"
        >
            {Array.from(messages.entries()).map(([messageId, message]) =>
                <ArtifactCard
                    key={messageId}
                    content={message.content}
                    actions={actions.get(messageId) || []}
                />
            )}
        </div>
    );
}