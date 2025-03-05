import { BorderedTextarea } from "@/components/ui/moving-border";
import { useProjectStore } from "@/store/projectStore";
import { CircleStop, CornerDownLeft, RotateCcw } from "lucide-react";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";

interface ButtonConfig {
    show: boolean;
    icon: React.ReactNode;
    onClick: () => void;
}

export const ChatInput = memo(({
    input,
    isLoading,
    reload,
    stop,
    setInput,
    placeholder,
    handleSubmit,
    error
}: {
    placeholder: string,
    handleSubmit: () => void
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>
    isLoading: boolean
    reload?: () => Promise<string | null | undefined>
    stop?: () => void
    error?: Error | undefined
}) => {
    const buttonConfigs: ButtonConfig[] = [
        {
            show: Boolean(!isLoading),
            icon: <CornerDownLeft className="size-4" />,
            onClick: handleSubmit
        },
        {
            show: Boolean(isLoading && stop),
            icon: <CircleStop className="size-4" />,
            onClick: stop || (() => { })
        },
        {
            show: Boolean(error && reload),
            icon: <RotateCcw className="size-4" />,
            onClick: reload || (() => { })
        }
    ];
    const { subscriptionData } = useProjectStore(
        useShallow(state => ({
            subscriptionData: state.subscriptionData
        }))
    )
    const activeButton = buttonConfigs.find(config => config.show);

    return (
        <div className="relative">
            {subscriptionData && (
                <div className="absolute w-11/12 left-1/2 -translate-x-1/2 shadow-md shadow-sky-600 text-center -top-5 px-2 border rounded-t-md text-sm">
                    {(subscriptionData.tokenUsage.daily.limit - subscriptionData.tokenUsage.daily.used).toLocaleString()}
                    {' '}
                    daily tokens left out of
                    {' '}
                    {subscriptionData.tokenUsage.daily.limit.toLocaleString()}
                    {' '}
                    tokens
                </div>
            )}
            <BorderedTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                rows={5}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        handleSubmit();
                    }
                }}
                className="bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
                borderClassName="bg-[radial-gradient(var(--sky-500)_40%,transparent_60%)]"
            />
            {activeButton && (
                <button className="px-4 absolute bottom-3 right-2 py-2 text-primary-foreground backdrop-blur-sm border border-black rounded-md hover:shadow-[0px_0px_4px_4px_rgba(0,0,0,0.1)] bg-primary text-sm transition duration-200"
                    onClick={activeButton.onClick}
                >
                    {activeButton.icon}
                </button>
            )}
        </div>
    );
});

ChatInput.displayName = 'ChatInput';
