import { isNewFile } from "@/lib/runtime";
import { ParsedMessage } from "@repo/common/types";
import { Check } from "lucide-react";
import { FileActionDisplay, ShellActionDisplay } from "./ActionDisplay";

export function ArtifactCard({ parsedMsg }: { parsedMsg: ParsedMessage }) {
    const { initialContext, actions, endingContext } = parsedMsg;
    return (
        <div className="flex flex-col gap-y-4 text-sm">
            <div>
                {initialContext}
            </div>
            <div className="flex flex-col gap-y-3 bg-primary-foreground rounded-md px-4 py-4">
                <div className="flex items-center gap-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Create initial files
                </div>
                {actions.map(action => action.type === 'file'
                    ? <FileActionDisplay key={action.id} action={action} isNew={isNewFile(action.filePath, actions.filter(a => a.type === 'file'))} />
                    : <ShellActionDisplay key={action.id} action={action} />
                )}
            </div>
            <div>
                {endingContext}
            </div>
        </div>
    )
}