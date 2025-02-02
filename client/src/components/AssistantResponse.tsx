import { ActionState } from "@repo/common/types";
import { Check } from "lucide-react";
import { FileActionDisplay, ShellActionDisplay } from "./ActionDisplay";
import { parse } from "best-effort-json-parser";

export function AssistantResponse({ content, actions }: { content: string, actions: ActionState[] }) {
    return (
        <div className="flex flex-col gap-y-4 text-sm bg-gray-100 rounded-lg px-4 py-4">
            <div>
                {content.slice(('<think>'.length), content.indexOf('</think>'))}
            </div>
            <div>
                {content.indexOf('</think') !== -1 && parse(content)?.artifact?.initialContext}
            </div>
            {actions.length > 0 && (
                <div className="flex flex-col gap-y-3 bg-primary-foreground rounded-md px-4 py-4">
                    <div className="flex items-center gap-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Create initial files
                    </div>
                    {actions.map(action => action.type === 'file'
                        ? <FileActionDisplay key={action.id} action={action} />
                        : <ShellActionDisplay key={action.id} action={action} />
                    )}
                </div>
            )}
            <div>
                {content.indexOf('</think') !== -1 && (parse(content)?.artifact?.endingContext ?? '')}
            </div>
        </div>
    )
}