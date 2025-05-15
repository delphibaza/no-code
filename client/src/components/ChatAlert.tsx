import { cn as classNames } from "@/lib/utils";
import type { ActionAlert } from "@/services/action-runner";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert } from "lucide-react";
import { memo } from "react";
import { Button } from "./ui/button";

interface Props {
  alert: ActionAlert;
  clearAlert: () => void;
  postMessage: (message: string) => void;
}

export const ChatAlert = memo(function ChatAlert({
  alert,
  clearAlert,
  postMessage,
}: Props) {
  const { description, content, source } = alert;

  const isPreview = source === "preview";
  const title = isPreview ? "Preview Error" : "Terminal Error";
  const message = isPreview
    ? "We encountered an error while running the preview. Would you like us to analyze and help resolve this issue?"
    : "We encountered an error while running terminal commands. Would you like us to analyze and help resolve this issue?";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`rounded-lg border border-red-200 bg-red-50 dark:border-red-400 dark:bg-gray-800 p-4 mb-1 shadow-lg shadow-red-100 dark:shadow-red-900`}
      >
        <div className="flex items-start">
          {/* Icon */}
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CircleAlert className="h-4 w-4 text-red-400" />
          </motion.div>
          {/* Content */}
          <div className="ml-3 flex-1">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`text-sm text-primary font-medium`}
            >
              {title}
            </motion.h3>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`mt-2 text-sm text-secondary-foreground`}
            >
              <p>{message}</p>
              {description && (
                <div className="text-xs p-2 rounded mt-4 mb-4">
                  Error: {description}
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={classNames("flex gap-2")}>
                <Button
                  onClick={() =>
                    postMessage(
                      `*Fix this ${
                        isPreview ? "preview" : "terminal"
                      } error* \n\`\`\`${
                        isPreview ? "js" : "sh"
                      }\n${content}\n\`\`\`\n`
                    )
                  }
                  size="sm"
                  variant="default"
                >
                  Ask AI
                </Button>
                <Button onClick={clearAlert} variant="outline" size="sm">
                  Dismiss
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
