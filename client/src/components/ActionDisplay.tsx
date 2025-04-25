import { Spinner } from "@/assets/icons/spinner";
import { isDevCommand, isInstallCommand } from "@/lib/utils";
import {
  FileActionState,
  ShellActionState,
  ShellState,
} from "@repo/common/types";
import { Check, CircleDashed, Terminal, X } from "lucide-react";
import { memo } from "react";

function getCommandType(command: string) {
  if (isInstallCommand(command)) return "install";
  if (isDevCommand(command)) return "start";
  return "run";
}
const ACTION_ICONS: Record<ShellState, React.ReactNode> = {
  queued: <CircleDashed className="h-4 w-4 text-gray-600" />,
  running: <Spinner />,
  completed: <Check className="h-4 w-4 text-green-500" />,
  error: <X className="h-4 w-4 text-red-500" />,
  aborted: <X className="h-4 w-4 text-red-500" />,
};
export const ShellActionDisplay = memo(
  ({ action }: { action: ShellActionState }) => {
    const commandType = getCommandType(action.command);
    return (
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-2">
          {action.state === "running" && commandType === "start" ? (
            <Terminal className="h-4 w-4" />
          ) : (
            ACTION_ICONS[action.state]
          )}
          <div>
            {commandType === "start"
              ? "Start application"
              : commandType === "install"
              ? "Install dependencies"
              : "Run command"}
          </div>
        </div>
        <code className="px-3 py-4 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm">
          {action.command}
        </code>
      </div>
    );
  }
);

export const FileActionDisplay = memo(
  ({ action }: { action: FileActionState }) => {
    const isInProgress =
      action.state === "creating" || action.state === "updating";
    const isCreatingAction =
      action.state === "creating" || action.state === "created";

    return (
      <div className="flex items-center gap-x-2">
        {isInProgress ? (
          <Spinner />
        ) : (
          <Check className="h-4 w-4 text-green-500" />
        )}
        <div className="flex-1">
          {isCreatingAction ? "Create " : "Update "}
          {action.filePath}
        </div>
      </div>
    );
  }
);

ShellActionDisplay.displayName = "ShellActionDisplay";
FileActionDisplay.displayName = "FileActionDisplay";
