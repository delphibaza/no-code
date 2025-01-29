import { Loader2 } from "lucide-react";
import { useGeneralStore } from "@/store/generalStore";

const PreviewCode = () => {
    const doneStreaming = useGeneralStore((state) => state.doneStreaming);
    const url = useGeneralStore((state) => state.iframeURL);

    // const handleTerminalResize = (cols: number, rows: number) => {
    //     if (shellProcess) {
    //         shellProcess.resize({ cols, rows });
    //     }
    // };

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
        </div>
    );
};

export default PreviewCode;