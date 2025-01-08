import { FileExplorer } from "@/components/FileExplorer";
import { API_URL } from "@/lib/constants";
import { StreamingMessageParser } from "@/lib/StreamingMessageParser";
import { getProjectFilesMsg } from "@/lib/utils";
import type { TemplateFiles } from "@repo/common/types";
import { ChatMessages } from "@repo/common/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useLocation, useParams } from "react-router-dom";
import { SSE } from "sse.js";

const messageParser = new StreamingMessageParser({
    callbacks: {
        onArtifactOpen: (data) => {
            // console.log("onArtifactOpen", data)
        },
        onArtifactClose: (data) => {
            // console.log("onArtifactClose", data)
        },
        onActionOpen: (data) => {
            // console.log(data);
        },
        onActionClose: (data) => {
            // console.log("onActionClose", data)
        },
    },
});

export default function ProjectInfo() {
    const [loading, setLoading] = useState(true);
    const { projectId } = useParams();
    const location = useLocation();
    const { enhancedPrompt, templateFiles, userMessage } = location.state as {
        enhancedPrompt: string,
        templateFiles: TemplateFiles,
        userMessage: string,
    };

    useEffect(() => {
        let source: SSE | null = null;
        let buffer = "";

        function streamCode() {
            const reqBody: ChatMessages = [
                { role: 'user', parts: [{ text: getProjectFilesMsg(templateFiles) }] },
                { role: 'user', parts: [{ text: `For all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.

By default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.

Use icons from lucide-react for logos.

Use stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.` }] },

                { role: 'user', parts: [{ text: enhancedPrompt }] },
            ];

            source = new SSE(`${API_URL}/api/chat`, {
                headers: { "Content-Type": "application/json" },
                payload: JSON.stringify({ messages: reqBody })
            });

            if (!source) {
                toast.error("Failed to establish connection with the server.");
                setLoading(false);
                return;
            }

            source.onmessage = (event) => {
                const data = event.data;
                if (data.trim() !== "") {
                    const { chunk } = JSON.parse(data);
                    buffer += chunk;

                    if (loading) {
                        setLoading(false);
                    }
                    messageParser.parse("1234", buffer);
                }
            };

            source.onerror = () => {
                toast.error("An error occurred while streaming code.");
                setLoading(false);
                source?.close();
            };
        }

        if (projectId) streamCode();

        return () => {
            if (source) source.close();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen w-full flex justify-center items-center">
                <Loader2 className="w-5 h-5 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <Toaster />
            <FileExplorer />
        </div>
    );
}
