import { useShallow } from "zustand/react/shallow"
import { ArtifactCard } from "./ArtifactCard"
import { useMessageStore } from "@/store/messageStore"

export function Workbench() {
    const { getActions } = useMessageStore(
        useShallow(state => ({
            getActions: state.getActions
        }))
    )

    return (
        <div style={{ scrollbarWidth: 'thin' }}
            className="h-[75vh] overflow-y-auto bg-gray-100 rounded-lg px-4 py-4"
        >
            {getActions().map(action =>
                <ArtifactCard
                    key={action.id}
                    parsedMsg={action}
                />
            )}
        </div>
    )
}