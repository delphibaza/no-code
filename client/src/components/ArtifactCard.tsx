import { ParsedMessage } from "@repo/common/types";

export function ArtifactCard({ parsedMsg }: { parsedMsg: ParsedMessage }) {
    const { initialContext, actions, endingContext } = parsedMsg;
    return (
        <div className="flex flex-col gap-y-2">
            <div className="font-medium">
                {initialContext}
            </div>
            <div className="flex flex-col gap-y-2">
                {actions.map(action => <div key={action.id}>{action.type}</div>)}
            </div>
            <div className="font-medium">
                {endingContext}
            </div>
        </div>
    )
}