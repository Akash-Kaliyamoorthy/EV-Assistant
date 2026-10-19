/** Animated typing indicator shown while waiting for AI response */
export default function TypingIndicator() {
  return (
    <div className="typing-indicator" aria-label="AI is thinking" aria-live="polite">
      <div className="msg-avatar ai" aria-hidden="true">⚡</div>
      <div className="typing-bubble">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
