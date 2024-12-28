import { PromptInput } from "./components/PromptInput";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <div className="min-h-screen w-full flex justify-center items-center">
      <Toaster />
      <PromptInput />
    </div>
  )
}