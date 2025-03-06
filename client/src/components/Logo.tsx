import { Sparkles } from "lucide-react";

export function Logo() {
    return (
        <div
            onClick={() => window.location.assign('/')}
            className="flex items-center gap-x-2 cursor-pointer text-lg"
        >
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="leading-none font-semibold">NoCode</span>
        </div>
    );
}