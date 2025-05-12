import { useState } from "react";
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
      <ChatInput
        placeholder="Type your prompt..."
        handleSubmit={handleSubmit}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
      />
    </div>
  );
}
