import { isDevCommand, isInstallCommand } from "@/lib/utils";
import { FileActionState, ShellActionState, ShellState } from "@repo/common/types";
import { Check, CircleDashed, Loader2, X } from "lucide-react";
import { memo } from "react";

const getCommandText = (command: string) => {
    if (isInstallCommand(command)) return 'Install dependencies';
    if (isDevCommand(command)) return 'Start application';
    return 'Run command';
};
const ACTION_ICONS: Record<ShellState, React.ReactNode> = {
    queued: <CircleDashed className="h-4 w-4 text-gray-600" />,
    running: <Loader2 className="h-4 w-4 animate-spin text-gray-500" />,
    completed: <Check className="h-4 w-4 text-green-500" />,
    error: <X className="h-4 w-4 text-red-500" />,
};
export const ShellActionDisplay = memo(({ action }: { action: ShellActionState }) => {

    return (
        <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
                {ACTION_ICONS[action.state]}
                <div>{getCommandText(action.command)}</div>
            </div>
            <code className="px-3 py-4 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm">
                {action.command}
            </code>
        </div>
    );
});

export const FileActionDisplay = memo(({ action }: { action: FileActionState }) => {
    const isInProgress = action.state === 'creating' || action.state === 'updating';
    const isCreatingAction = action.state === 'creating' || action.state === 'created';

    return (
        <div className="flex items-center gap-x-2">
            {isInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
                <Check className="h-4 w-4 text-green-500" />
            )}
            <div className="flex-1">
                {isCreatingAction ? 'Create ' : 'Update '}
                {action.filePath}
            </div>
        </div>
    );
});

ShellActionDisplay.displayName = 'ShellActionDisplay';
FileActionDisplay.displayName = 'FileActionDisplay';
