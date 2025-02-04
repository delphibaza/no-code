import { API_URL } from "@/lib/constants";
import { PromptSchema } from "@repo/common/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { Input } from "./Input";
import { useProjectStore } from "@/store/projectStore";
import { useShallow } from "zustand/react/shallow";

export function PromptInput() {
    const navigate = useNavigate();
    const { upsertMessage } = useProjectStore(
        useShallow(state => ({
            upsertMessage: state.upsertMessage,
        }))
    );

    async function handleSubmit(input: string) {
        try {
            const response = await fetch(`${API_URL}/api/new`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prompt: input } as PromptSchema)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.msg);
            }
            upsertMessage({
                id: crypto.randomUUID(),
                role: 'user',
                timestamp: Date.now(),
                content: input
            });
            navigate(`/project/${result.projectId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error while getting files"
            toast.error(errorMessage)
        }
    }
    return (
        <div className="relative flex flex-col w-full md:w-1/2">
            <Input placeholder="Type a prompt" handleSubmit={handleSubmit} />
        </div>
    )
}