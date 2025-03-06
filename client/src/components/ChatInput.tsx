import { useProjectStore } from "@/store/projectStore";
import { CircleStop, CornerDownLeft, RotateCcw } from "lucide-react";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

    const rainbowVariants = {
        initial: {
            boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
        },
        animate: {
            boxShadow: [
                "0 0 15px rgba(255, 0, 0, 0.5)",
                "0 0 15px rgba(255, 165, 0, 0.5)",
                "0 0 15px rgba(255, 255, 0, 0.5)",
                "0 0 15px rgba(0, 255, 0, 0.5)",
                "0 0 15px rgba(0, 0, 255, 0.5)",
                "0 0 15px rgba(238, 130, 238, 0.5)",
                "0 0 15px rgba(255, 0, 0, 0.5)",
            ],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "linear",
            },
        },
    };

    return (
        <div className="relative">
            {subscriptionData && (
                <div className="absolute w-11/12 left-1/2 -translate-x-1/2 shadow-md shadow-sky-600 dark:shadow-sky-400 text-center -top-5 px-2 border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 rounded-t-md text-sm">
                    {(subscriptionData.tokenUsage.daily.limit - subscriptionData.tokenUsage.daily.used).toLocaleString()}
                    {' '}
                    daily tokens left out of
                    {' '}
                    {subscriptionData.tokenUsage.daily.limit.toLocaleString()}
                    {' '}
                    tokens
                </div>
            )}
            <motion.div
                variants={rainbowVariants}
                initial="initial"
                animate={isLoading ? "animate" : "initial"}
                className="rounded-lg overflow-hidden"
            >
                <Textarea
                    rows={5}
                    className={cn(
                        "relative pl-4 pr-10 py-3 rounded-lg",
                        "transition-shadow duration-300",
                        "focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                        "bg-white dark:bg-slate-900 text-black dark:text-white"
                    )}
                    placeholder={placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
            </motion.div>
            {activeButton && (
                <Button
                    size="sm"
                    onClick={activeButton.onClick}
                    className="absolute bottom-3 right-2"
                >
                    {activeButton.icon}
                </Button>
            )}
        </div>
    );
});

ChatInput.displayName = 'ChatInput';
