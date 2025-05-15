import { cn } from "@/lib/utils";
import { useFilesStore } from "@/stores/files";
import { useGeneralStore } from "@/stores/general";
import { ActionState } from "@repo/common/types";
import { parse } from "best-effort-json-parser";
import { ChevronDown, ChevronRight, Loader } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useShallow } from "zustand/react/shallow";
import { FileActionDisplay, ShellActionDisplay } from "./ActionDisplay";
import { Button } from "./ui/button";

function parseContent(content: string) {
  try {
    return parse(content);
  } catch {
    return null;
  }
}

const Reasoning = memo(function Reasoning({
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
          <div className="font-medium text-sm text-gray-600 dark:text-gray-200">
            Reasoning
          </div>
          <Loader className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm text-gray-600 dark:text-gray-200">
            Reasoned for a few seconds
          </div>
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
            className="text-sm bg-[#f7f7f7] dark:bg-gray-800 flex flex-col gap-4 border-l pl-3 dark:border-zinc-800"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="prose text-sm/6 text-gray-600 dark:text-gray-400">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {reasoning}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const ActionsPanel = memo(function ActionsPanel({
  title,
  actions,
  isExpanded,
  onToggle,
}: {
  title: string;
  actions: ActionState[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const setSelectedFile = useFilesStore(
    useShallow((state) => state.setSelectedFile)
  );
  const setCurrentTab = useGeneralStore(
    useShallow((state) => state.setCurrentTab)
  );

  return (
    <div className="bg-white dark:bg-gray-950 shadow-sm border rounded-md space-y-1">
      <div className="flex items-center justify-between px-5 py-2 border-b dark:border-zinc-800 border-zinc-200 font-medium text-sm">
        <span>{title}</span>
        <Button
          variant="ghost"
          className={cn("rounded-full transition-transform", {
            "-rotate-180": isExpanded,
          })}
          size="icon"
          onClick={onToggle}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="actions-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col gap-y-3 px-5 py-4 overflow-hidden"
          >
            <AnimatePresence initial={false}>
              {actions.map((action) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {action.type === "file" ? (
                    <FileActionDisplay
                      action={action}
                      onClick={() => {
                        setCurrentTab("code");
                        setSelectedFile(action.filePath);
                      }}
                    />
                  ) : (
                    <ShellActionDisplay
                      action={action}
                      onClick={() => setCurrentTab("preview")}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const AssistantResponse = memo(function AssistantResponse({
  content,
  actions,
  reasoning,
  tokensUsed,
}: {
  content: string;
  actions: ActionState[];
  reasoning?: string;
  tokensUsed?: number;
}) {
  const artifact = useMemo(() => parseContent(content)?.artifact, [content]);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-y-4 bg-[#f7f7f7] dark:bg-gray-800 text-sm/6 rounded-lg px-4 py-3">
      {reasoning && (
        <Reasoning
          reasoning={reasoning}
          isReasoning={!artifact?.initialContext}
        />
      )}
      {artifact?.title && (
        <>
          <div className="prose text-sm/6 text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {artifact.initialContext}
            </ReactMarkdown>
          </div>
          {actions.length > 0 && (
            <ActionsPanel
              title={artifact.title}
              actions={actions}
              isExpanded={isExpanded}
              onToggle={() => setIsExpanded((prev) => !prev)}
            />
          )}
          <div className="prose text-sm/6 text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {artifact.endingContext}
            </ReactMarkdown>
          </div>
        </>
      )}
      <div className="flex justify-end">
        {tokensUsed && (
          <div className="text-xs text-muted-foreground">
            Tokens Used : {tokensUsed}
          </div>
        )}
      </div>
    </div>
  );
});
