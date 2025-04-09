import { getTerminalTheme } from "@/lib/utils";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal as XTerm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useTheme } from "./ui/theme-provider";

export interface TerminalRef {
  reloadStyles: () => void;
}
export interface TerminalProps {
  className?: string;
  readonly?: boolean;
  id: string;
  onTerminalReady?: (terminal: XTerm) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className, onTerminalReady, id, onTerminalResize, readonly }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm | null>(null);
      const { theme } = useTheme();

      // Initialize terminal - only runs once
      useEffect(() => {
        const element = terminalElementRef.current;
        if (!element) return;

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        const terminal = new XTerm({
          cursorBlink: true,
          convertEol: true,
          disableStdin: readonly,
          theme: getTerminalTheme(theme),
          fontSize: 12,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        });

        terminalRef.current = terminal;
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.open(element);

        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
          onTerminalResize?.(terminal.cols, terminal.rows);
        });
        resizeObserver.observe(element);

        console.log(`Attach [${id}]`);

        onTerminalReady?.(terminal);

        return () => {
          resizeObserver.disconnect();
          terminal.dispose();
        };
      }, []);

      // Update theme when it changes
      useEffect(() => {
        const terminal = terminalRef.current!;

        // we render a transparent cursor in case the terminal is readonly
        terminal.options.theme = readonly
          ? { ...getTerminalTheme(theme), cursor: "#00000000" }
          : getTerminalTheme(theme);

        terminal.options.disableStdin = readonly;
      }, [theme, readonly]);

      useImperativeHandle(ref, () => {
        return {
          reloadStyles: () => {
            const terminal = terminalRef.current!;
            terminal.options.theme = readonly
              ? { ...getTerminalTheme(theme), cursor: "#00000000" }
              : getTerminalTheme(theme);
          },
        };
      }, [theme, readonly]);

      return <div className={className} ref={terminalElementRef} />;
    },
  ),
);

Terminal.displayName = "Terminal";
