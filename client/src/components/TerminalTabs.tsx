import { cn as classNames } from "@/lib/utils";
import { useGeneralStore } from "@/stores/general";
import { terminalStore } from "@/stores/terminal";
import { ChevronDown, Plus } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import { type ImperativePanelHandle } from "react-resizable-panels";
import { useShallow } from "zustand/react/shallow";
import { Terminal, type TerminalRef } from "./Terminal";

const MAX_TERMINALS = 3;
export const DEFAULT_TERMINAL_SIZE = 25;

export const TerminalTabs = memo(({ readonly }: { readonly?: boolean }) => {
  const { showTerminal, setShowTerminal } = useGeneralStore(
    useShallow((state) => ({
      showTerminal: state.showTerminal,
      setShowTerminal: state.setShowTerminal,
    }))
  );
  const terminalRefs = useRef<Array<TerminalRef | null>>([]);
  const terminalPanelRef = useRef<ImperativePanelHandle>(null);
  const terminalToggledByShortcut = useRef(false);

  const [activeTerminal, setActiveTerminal] = useState(0);
  const [terminalCount, setTerminalCount] = useState(1);

  const addTerminal = () => {
    if (terminalCount < MAX_TERMINALS) {
      setTerminalCount(terminalCount + 1);
      setActiveTerminal(terminalCount);
    }
  };

  useEffect(() => {
    const { current: terminal } = terminalPanelRef;

    if (!terminal) {
      return;
    }

    const isCollapsed = terminal.isCollapsed();

    if (!showTerminal && !isCollapsed) {
      terminal.collapse();
    } else if (showTerminal && isCollapsed) {
      terminal.resize(DEFAULT_TERMINAL_SIZE);
    }

    terminalToggledByShortcut.current = false;
  }, [showTerminal]);

  return (
    <div className="h-full">
      <div className="h-full flex flex-col">
        <div className="flex items-center bg-bolt-elements-background-depth-2 border-y border-bolt-elements-borderColor gap-1.5 min-h-[34px] p-2">
          {Array.from({ length: terminalCount + 1 }, (_, index) => {
            const isActive = activeTerminal === index;
            return (
              <React.Fragment key={index}>
                {index === 0 ? (
                  <button
                    className={classNames(
                      "flex items-center text-xs cursor-pointer gap-1.5 px-2 py-2 h-full whitespace-nowrap rounded-full",
                      {
                        "bg-sky-100 dark:bg-gray-800 hover:bg-sky-100 hover:text-blue-500 text-blue-500":
                          isActive,
                      }
                    )}
                    onClick={() => setActiveTerminal(index)}
                  >
                    <div className="i-ph:terminal-window-duotone text-base" />
                    AI Terminal
                  </button>
                ) : (
                  <button
                    className={classNames(
                      "flex items-center text-xs cursor-pointer gap-1.5 px-2 py-1 h-full whitespace-nowrap rounded-full",
                      {
                        "bg-sky-100 dark:bg-gray-800 hover:bg-sky-100 hover:text-blue-500 text-blue-500":
                          isActive,
                      }
                    )}
                    onClick={() => setActiveTerminal(index)}
                  >
                    Terminal {terminalCount > 1 && index}
                  </button>
                )}
              </React.Fragment>
            );
          })}
          {terminalCount < MAX_TERMINALS && (
            <Plus
              size={16}
              className="cursor-pointer text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
              onClick={addTerminal}
            />
          )}
          <ChevronDown
            className="ml-auto cursor-pointer text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
            size={16}
            onClick={() => setShowTerminal(false)}
          />
        </div>
        {Array.from({ length: terminalCount + 1 }, (_, index) => {
          const isActive = activeTerminal === index;

          if (index === 0) {
            return (
              <Terminal
                key={index}
                id={`terminal_${index}`}
                className={classNames("h-full overflow-hidden", {
                  hidden: !isActive,
                })}
                ref={(ref) => {
                  terminalRefs.current[index] = ref;
                }}
                readonly={readonly}
                onTerminalReady={(terminal) =>
                  terminalStore.attachBoltTerminal(terminal)
                }
                onTerminalResize={(cols, rows) =>
                  terminalStore.onTerminalResize(cols, rows)
                }
              />
            );
          } else {
            return (
              <Terminal
                key={index}
                id={`terminal_${index}`}
                className={classNames("h-full overflow-hidden", {
                  hidden: !isActive,
                })}
                ref={(ref) => {
                  terminalRefs.current[index] = ref;
                }}
                readonly={readonly}
                onTerminalReady={(terminal) =>
                  terminalStore.attachTerminal(terminal)
                }
                onTerminalResize={(cols, rows) =>
                  terminalStore.onTerminalResize(cols, rows)
                }
              />
            );
          }
        })}
      </div>
    </div>
  );
});

TerminalTabs.displayName = "TerminalTabs";
