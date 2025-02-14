import { useGeneralStore } from "@/store/generalStore";
import { Button } from "./ui/button";

export function ProcessSwitcher() {
    const { processes, activeProcessId, setActiveProcessId } = useGeneralStore();
    const processList = Array.from(processes.values());

    if (!processList.length) return null;

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-secondary">
            {processList.map((process) => (
                <Button
                    key={process.id}
                    variant={activeProcessId === process.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveProcessId(process.id)}
                    className="flex items-center gap-2"
                >
                    <div className={`w-2 h-2 rounded-full ${process.status === 'running' ? 'bg-green-500' :
                        process.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    {process.port}
                </Button>
            ))}
        </div>
    );
}