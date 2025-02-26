import { Toaster } from "react-hot-toast";
import { PromptInput } from "../components/PromptInput";

export default function Home() {
    return (
        <div className="h-full w-full flex justify-center items-center">
            <Toaster />
            <PromptInput />
        </div>
    )
}