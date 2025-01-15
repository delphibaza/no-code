import { getWebContainer } from "@/config/webContainer";
import { Directory, Files, Folders } from "@repo/common/types";
import { WebContainer } from "@webcontainer/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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

const PreviewCode = ({ folders, done }: { folders: Folders[], done: boolean }) => {
    const [url, setUrl] = useState<string>("");
    const [webContainer, setWebContainer] = useState<WebContainer | null>(null);

    async function installAndRunCont() {
        const formattedFiles = formatFilesToMountFn(folders);
        if (!webContainer) {
            return;
        }
        try {
            await webContainer.mount(formattedFiles);
            const installProcess = await webContainer.spawn("npm", ["install"]);
            installProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        console.log(data);
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
                        console.log(data)
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
        if (!webContainer) {
            getWebContainer().then((container) => {
                setWebContainer(container);
                console.log("container started");
            });
        }
    }, []);

    useEffect(() => {
        if (done && webContainer) {
            installAndRunCont();
        }
    }, [done, webContainer]);

    return (
        <div className="h-full w-full">
            {!url
                ? <div className="flex h-full items-center justify-center border-2 rounded-md shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                : <iframe width={"100%"} height={"100%"} src={url} />}
        </div>
    );
};

export default PreviewCode;