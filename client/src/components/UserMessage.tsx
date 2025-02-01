
export function UserMessage({ content }: { content: string }) {
    return (
        <div className="flex flex-col gap-y-4 text-sm bg-gray-100 rounded-lg px-4 py-4">
            {content}
        </div>
    )
}
