import { getWebContainer } from "@/config/webContainer";
import { Directory, Files, Folders } from "@repo/common/types";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import type { Terminal as XTerm } from "@xterm/xterm";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Terminal } from "./Terminal";
import { useStore } from "@/store/useStore";

function formatFilesToMountFn(folders: Folders[], result: Files = {}): Files {
    folders.forEach((item) => {
        if (item.type === "file") {
            result[item.name] = {
                file: {
                    contents: item.content || "",
                },
            };
        } else if (item.type === "folder") {
            result[item.name] = {
                directory: {},
            };
            formatFilesToMountFn(item.children || [], (result[item.name] as Directory).directory);
        }
    });
    return result;
}
async function startShell(terminal: XTerm, webContainer: WebContainer) {
    const shellProcess = await webContainer.spawn('jsh', {
        terminal: {
            cols: terminal.cols,
            rows: terminal.rows,
        },
    });
    shellProcess.output.pipeTo(
        new WritableStream({
            write(data) {
                terminal.write(data);
            },
        })
    );

    const input = shellProcess.input.getWriter();
    terminal.onData((data) => {
        input.write(data);
    });

    return shellProcess;
}

const PreviewCode = ({ folders }: { folders: Folders[] }) => {
    const [url, setUrl] = useState<string>("");
    const [terminal, setTerminal] = useState<XTerm | null>(null);
    const [shellProcess, setShellProcess] = useState<WebContainerProcess | null>(null);
    const doneStreaming = useStore((state) => state.doneStreaming);
    const webContainer = useStore((state) => state.webContainerInstance);
    const setWebContainer = useStore((state) => state.setWebContainerInstance);

    async function installAndRunCont() {
        const formattedFiles = formatFilesToMountFn(folders);
        if (!webContainer || !terminal) {
            return;
        }
        try {
            await webContainer.mount(formattedFiles);
            const process = await startShell(terminal, webContainer);
            setShellProcess(process);
            const installProcess = await webContainer.spawn("npm", ["install"]);
            installProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        terminal.write(data);
                    },
                })
            );
            const installExitCode = await installProcess.exit;
            if (installExitCode !== 0) {
                throw new Error("Installation failed");
            }
            const serverProcess = await webContainer.spawn("npm", ["run", "dev"]);
            serverProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        terminal.write(data)
                    },
                })
            );
            // Wait for `server-ready` event
            webContainer.on("server-ready", (port, url) => {
                console.log(url);
                console.log(port);
                setUrl(url);
            });
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (!webContainer && doneStreaming) {
            getWebContainer().then((container) => {
                setWebContainer(container);
                console.log("container started");
            });
        }
    }, []);

    useEffect(() => {
        if (doneStreaming && webContainer && terminal) {
            installAndRunCont();
        }
    }, [doneStreaming, webContainer, terminal]);

    const handleTerminalResize = (cols: number, rows: number) => {
        if (shellProcess) {
            shellProcess.resize({ cols, rows });
        }
    };

    if (!doneStreaming) {
        return (
            <div className="flex justify-center items-center text-sm h-full border-2 rounded-md shadow-sm">
                No preview available!
            </div>
        )
    }

    return (
        <div className="h-full w-full space-y-3">
            {
                !url
                    ? <div className="flex h-full items-center justify-center border-2 rounded-md shadow-sm">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    : <iframe width={"100%"} height={"100%"} src={url} />
            }
            <Terminal onTerminalReady={setTerminal} onTerminalResize={handleTerminalResize} />
        </div>
    );
};

export default PreviewCode;