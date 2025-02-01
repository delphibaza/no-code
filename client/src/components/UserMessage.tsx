import { CircleUser } from "lucide-react";

export function UserMessage({ content }: { content: string }) {
    return (
        <div className="flex items-center gap-x-4 text-sm bg-gray-100 rounded-lg px-4 py-4">
            <div className="flex-shrink-0">
                <CircleUser className="h-6 w-6" />
            </div>
            <div>
                {content}
            </div>
        </div>
    )
}
