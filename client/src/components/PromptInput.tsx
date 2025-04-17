import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { ChatInput } from "./ChatInput";

export function PromptInput({
  handleSubmit,
  isLoading,
}: {
  handleSubmit: (input: string, templateName?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [input, setInput] = useState("");

  return (
    <div className="relative flex flex-col w-full">
      <Toaster />
      <ChatInput
        placeholder="Type a prompt ..."
        handleSubmit={handleSubmit}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
      />
    </div>
  );
}
