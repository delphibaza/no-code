import { useStore } from "@/store/useStore"
import { useShallow } from "zustand/react/shallow"
import { ArtifactCard } from "./ArtifactCard"

export function Workbench() {
    const { messages } = useStore(
        useShallow(state => ({
            messages: state.messages
        }))
    )

    return (
        <div style={{ scrollbarWidth: 'thin' }}
            className="h-[75vh] overflow-y-auto bg-gray-100 rounded-lg px-4 py-4"
        >
            {Array.from(messages).map(([id, message]) =>
                <ArtifactCard
                    key={id}
                    parsedMsg={message}
                />
            )}
        </div>
    )
}