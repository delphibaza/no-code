import { cn, getLightOrDarkTheme, getTerminalTheme } from '@/lib/utils';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { memo, useEffect, useRef } from "react";
import { useTheme } from './ui/theme-provider';
export interface TerminalProps {
    className?: string;
    readonly?: boolean;
    onTerminalReady?: (terminal: XTerm) => void;
    onTerminalResize?: (cols: number, rows: number) => void;
}

export const Terminal = memo(({ className, onTerminalReady, onTerminalResize, readonly }: TerminalProps) => {
    const terminalElementRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<XTerm>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const element = terminalElementRef.current!;
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        const terminal = new XTerm({
            cursorBlink: true,
            convertEol: true,
            disableStdin: readonly,
            theme: getTerminalTheme(theme),
            fontSize: 12,
            fontFamily: 'Menlo, courier-new, courier, monospace',
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
        onTerminalReady?.(terminal);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        const terminal = terminalRef.current!;
        terminal.options.theme = getTerminalTheme(theme);
    }, [theme]);

    return (
        <div className={
            cn(className,
                'border-x px-4 pt-2 pb-4',
                'overflow-x-hidden overflow-y-scroll h-[20vh]',
                getLightOrDarkTheme(theme) === 'dark' ? 'bg-black' : 'bg-white'
            )}
            ref={terminalElementRef}
        />
    );
});
Terminal.displayName = 'Terminal';