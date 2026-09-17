// src/ui/Chat.tsx
// Source of truth: issue #138 DoD — "Input, history, markdown, auto-scroll,
// max 2000 chars" (corrected on the board from a "500" typo, per
// src/domain/schemas.ts's UserMessageSchema.max(2000) and docs/PLAYWRIGHT.md
// E2E-06, both already documenting 2000 as the real limit).
//
// This is a self-contained, reusable component (messages + onSendMessage
// props) — wiring it into ui/App.tsx's CHATTING scene with real message
// state happens during SSE integration (#142), not here.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { renderLightMarkdown } from "./markdown";
import "./Chat.css";

export const MAX_MESSAGE_LENGTH = 2000;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function Chat({ messages, onSendMessage, disabled }: ChatProps) {
  const [draft, setDraft] = useState("");
  const historyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const history = historyRef.current;
    if (!history) return;
    history.scrollTo({ top: history.scrollHeight });
  }, [messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setDraft("");
  }

  return (
    <div data-component="Chat">
      <div ref={historyRef} data-testid="chat-history" className="chat-history">
        {messages.map((message, index) => (
          <div
            key={index}
            data-role={message.role}
            className={
              message.role === "assistant"
                ? "chat-message-assistant"
                : "chat-message-user"
            }
          >
            {message.role === "assistant"
              ? renderLightMarkdown(message.content)
              : message.content}
          </div>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-textarea"
          value={draft}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled}
        />
        <span className="chat-char-counter">
          {draft.length}/{MAX_MESSAGE_LENGTH}
        </span>
        <button
          className="btn-primary"
          type="submit"
          disabled={disabled || draft.trim().length === 0}
        >
          Send
        </button>
      </form>
    </div>
  );
}
