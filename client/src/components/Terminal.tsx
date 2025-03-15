import { cn, getTerminalTheme } from '@/lib/utils';
import { TerminalType, useGeneralStore } from '@/store/generalStore';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { memo, useEffect, useRef } from "react";
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from './ui/theme-provider';

export interface TerminalProps {
    className?: string;
    readonly?: boolean;
    terminalType?: TerminalType;
    onTerminalReady?: (terminal: XTerm) => void;
    onTerminalResize?: (cols: number, rows: number) => void;
}

export const Terminal = memo(({ className, onTerminalReady, onTerminalResize, readonly }: TerminalProps) => {
    const terminalElementRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { theme } = useTheme();
    const currentTab = useGeneralStore(
        useShallow((state) => state.currentTab)
    );

    // Compact resize function that handles all resizing needs
    const resizeTerminal = () => {
        if (!fitAddonRef.current || !terminalRef.current) return;

        // Clear any pending resize timeouts
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);

        // Schedule multiple resize attempts with increasing delays
        const delays = [50, 150, 300];
        delays.forEach(delay => {
            resizeTimeoutRef.current = setTimeout(() => {
                try {
                    fitAddonRef.current?.fit();
                    // Force a full refresh of the terminal
                    terminalRef.current?.refresh(0, terminalRef.current.rows - 1);
                    onTerminalResize?.(terminalRef.current?.cols || 80, terminalRef.current?.rows || 24);
                } catch (err) {
                    console.error('Terminal resize error:', err);
                }
            }, delay);
        });
    };

    // Initialize terminal - only runs once
    useEffect(() => {
        if (!terminalElementRef.current) return;

        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;

        const terminal = new XTerm({
            cursorBlink: true, convertEol: true, disableStdin: readonly,
            theme: getTerminalTheme(theme), fontSize: 13,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            scrollback: 5000,
            allowTransparency: true,
        });

        terminalRef.current = terminal;
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(new WebLinksAddon());
        terminal.open(terminalElementRef.current);

        // Initial resize
        resizeTerminal();

        // Set up resize observers
        const handleResize = () => resizeTerminal();
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(terminalElementRef.current);
        window.addEventListener('resize', handleResize);

        // Set up visibility change handler
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') resizeTerminal();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Notify parent
        onTerminalReady?.(terminal);

        // Cleanup
        return () => {
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            terminalRef.current?.dispose();
            terminalRef.current = null;
            fitAddonRef.current = null;
        };
    }, []);

    // Update theme when it changes
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.options.theme = getTerminalTheme(theme);
        }
    }, [theme]);

    // Handle tab switching
    useEffect(() => {
        if (currentTab === 'code') resizeTerminal();
    }, [currentTab]);

    return (
        <div className="flex flex-col h-full w-full pl-4 py-2 bg-white dark:bg-black">
            <div
                className={cn('h-full w-full overflow-hidden', className)}
                ref={terminalElementRef}
            />
        </div>
    );
});

Terminal.displayName = 'Terminal';