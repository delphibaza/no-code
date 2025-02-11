import { CircleStop, CornerDownLeft, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { memo } from "react";

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
            show: Boolean(input && !isLoading),
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
    const activeButton = buttonConfigs.find(config => config.show);

    return (
        <div className="relative">
            <Textarea
                className="relative"
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        handleSubmit();
                    }
                }}
            />
            {activeButton && (
                <Button
                    size="sm"
                    onClick={activeButton.onClick}
                    className="absolute bottom-2 right-2"
                >
                    {activeButton.icon}
                </Button>
            )}
        </div>
    );
});

ChatInput.displayName = 'ChatInput';