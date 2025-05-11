import { useProjectStore } from "@/stores/project";
import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { AssistantResponse } from "./AssistantResponse";
import { UserMessage } from "./UserMessage";

export function Workbench() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { actions, messageHistory } = useProjectStore(
    useShallow((state) => ({
      actions: state.actions,
      messageHistory: state.messageHistory,
    }))
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const isNotAtBottom = () => {
    const container = containerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Return true if the user is NOT at the bottom
    return scrollHeight - scrollTop - clientHeight > 50;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll to bottom only if user is at the bottom,
    // if the user has scrolled up, only scroll down if a new message is added
    if (!isNotAtBottom()) {
      scrollToBottom();
    }
  }, [messageHistory]); // Scroll when messages change

  useEffect(() => {
    scrollToBottom();
  }, [messageHistory.length]);

  const filteredMessageHistory = useMemo(() => {
    return messageHistory
      .filter(
        (message) => message.role === "user" || message.role === "assistant"
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messageHistory]);

  return (
    <div
      style={{ scrollbarWidth: "none" }}
      className="md:h-[70vh] h-full overflow-y-auto space-y-3"
      ref={containerRef}
    >
      {filteredMessageHistory.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} content={message.content} />
        ) : (
          <AssistantResponse
            key={message.id}
            reasoning={message?.reasoning}
            content={message.content}
            actions={actions.get(message.id) || []}
            tokensUsed={message.tokensUsed}
          />
        )
      )}
      <div className="w-0 h-0" ref={messagesEndRef} />
    </div>
  );
}
