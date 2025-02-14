import { useGeneralStore } from "@/store/generalStore";
import { ProcessSwitcher } from "./ProcessSwitcher";
import { useShallow } from "zustand/react/shallow";

export function Preview() {
    const { activeProcess } = useGeneralStore(
        useShallow((state) => ({
            activeProcess: state.activeProcessId
                ? state.processes.get(state.activeProcessId) ?? null
                : null,
        }))
    );

    if (!activeProcess) {
        return <div className="flex items-center justify-center h-full">No preview available</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <ProcessSwitcher />
            <iframe
                src={activeProcess.url}
                className="flex-1 w-full"
                title="preview"
            />
        </div>
    );
}