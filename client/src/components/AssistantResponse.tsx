import { cn } from "@/lib/utils";
import { ActionState } from "@repo/common/types";
import { parse } from "best-effort-json-parser";
import { ChevronDown, ChevronRight, Loader } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FileActionDisplay, ShellActionDisplay } from "./ActionDisplay";

function parseContent(content: string) {
  try {
    return parse(content);
  } catch {
    return null;
  }
}
export function Reasoning({
  reasoning,
  isReasoning,
}: {
  reasoning: string;
  isReasoning: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: 0,
    },
  };

  useEffect(() => {
    if (!isReasoning) {
      setIsExpanded(false);
    }
  }, [isReasoning]);

  return (
    <div className="flex flex-col">
      {isReasoning ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoning</div>
          <Loader className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoned for a few seconds</div>
          <button
            className={cn(
              "cursor-pointer rounded-full dark:hover:bg-zinc-800 hover:bg-zinc-200",
              {
                "dark:bg-zinc-800 bg-zinc-200": isExpanded,
              }
            )}
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="text-sm dark:text-zinc-400 text-zinc-600 flex flex-col gap-4 border-l pl-3 dark:border-zinc-800"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {reasoning}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AssistantResponse({
  content,
  actions,
  reasoning,
}: {
  content: string;
  actions: ActionState[];
  reasoning?: string;
}) {
  const parsedContent = parseContent(content);

  return (
    <div className="flex flex-col gap-y-4 bg-[#F5F5F5] dark:bg-gray-800 text-sm/6 rounded-lg px-4 py-3">
      {reasoning && (
        <Reasoning
          reasoning={reasoning}
          isReasoning={!parsedContent?.artifact?.initialContext}
        />
      )}
      <div className="break-words overflow-wrap-anywhere whitespace-pre-wrap min-w-0 flex-1">
        {parsedContent?.artifact?.initialContext ?? ""}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-col gap-y-3 bg-primary-foreground rounded-md px-4 py-4">
          {actions.map((action) =>
            action.type === "file" ? (
              <FileActionDisplay key={action.id} action={action} />
            ) : (
              <ShellActionDisplay key={action.id} action={action} />
            )
          )}
        </div>
      )}
      <div
        className="break-words overflow-wrap-anywhere whitespace-pre-line min-w-0 flex-1"
        dangerouslySetInnerHTML={{
          __html: parsedContent?.artifact?.endingContext ?? "",
        }}
      />
    </div>
  );
}
