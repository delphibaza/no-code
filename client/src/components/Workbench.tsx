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
        <div className="w-[25vw] h-[75vh] bg-gray-100 rounded-md px-3 py-4">
            {Array.from(messages).map(([id, message]) =>
                <ArtifactCard
                    key={id}
                    parsedMsg={message}
                />
            )}
        </div>
    )
}