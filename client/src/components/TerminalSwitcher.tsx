import { Button } from "@/components/ui/button";
import { useGeneralStore } from "@/store/generalStore";
import { MonitorIcon, ServerIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

export function TerminalSwitcher() {
    const { activeTerminalType, setActiveTerminalType } = useGeneralStore(
        useShallow((state) => ({
            activeTerminalType: state.activeTerminalType,
            setActiveTerminalType: state.setActiveTerminalType
        }))
    );

    return (
        <div className="flex items-center space-x-1 bg-primary-foreground max-w-fit px-2 py-1 rounded-t-md border-b-0">
            <Button
                onClick={() => setActiveTerminalType('system')}
                variant={'ghost'}
                size={'sm'}
                className={`flex items-center gap-1 rounded-md text-xs h-7 ${activeTerminalType === 'system' &&
                    'bg-sky-100 dark:bg-gray-800 hover:bg-sky-100 hover:text-blue-500 text-blue-500'
                    }`}
            >
                <ServerIcon className="h-3 w-3" />
                System
            </Button>
            <Button
                onClick={() => setActiveTerminalType('user')}
                variant={'ghost'}
                size={'sm'}
                className={`flex items-center gap-1 rounded-md text-xs h-7 ${activeTerminalType === 'user' &&
                    'bg-sky-100 dark:bg-gray-800 hover:bg-sky-100 hover:text-blue-500 text-blue-500'
                    }`}
            >
                <MonitorIcon className="h-3 w-3" />
                User
            </Button>
        </div>
    );
}