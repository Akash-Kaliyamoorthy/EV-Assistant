import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Zap, Calculator, BatteryCharging, DollarSign, MapPin, Route, Wrench } from 'lucide-react';
import ChatMessage from '../components/ChatMessage.jsx';
import TypingIndicator from '../components/TypingIndicator.jsx';
import { sendChatMessage } from '../services/api.js';

const SUGGESTIONS = [
  { icon: Calculator,      label: 'Calculate charging time',  prompt: 'How long will it take to charge my EV from 20% to 80%?' },
  { icon: DollarSign,      label: 'Estimate charging cost',   prompt: 'How much will it cost to charge my EV at home?' },
  { icon: BatteryCharging, label: 'Check remaining range',    prompt: 'How far can I drive with my current battery level?' },
  { icon: MapPin,          label: 'Find charging stations',   prompt: 'How do I find nearby EV charging stations?' },
  { icon: Wrench,          label: 'Troubleshoot charging',    prompt: 'My EV is not charging. What should I check?' },
  { icon: Route,           label: 'Plan my trip',             prompt: 'I want to drive from Chennai to Bengaluru. Do I need to charge on the way?' },
];

export default function ChatPage({
  activeSession, onAddMessage, apiProfile, onNavigate
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const messages = activeSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError(null);
    onAddMessage('user', trimmed);
    setIsLoading(true);

    // Build history from current messages (not yet including the new user message)
    const history = messages.map(m => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      content: m.content,
    }));

    try {
      const data = await sendChatMessage({
        message: trimmed,
        conversation_history: history,
        vehicle_profile: apiProfile || null,
      });
      onAddMessage('model', data.reply, data.calculation_context);
    } catch (err) {
      const msg = err?.message || 'Failed to connect to the AI assistant. Please check your connection and try again.';
      setError(msg);
      onAddMessage('model', `⚠️ ${msg}`, null);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, apiProfile, onAddMessage]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const showWelcome = messages.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Chat messages area */}
      <div className="chat-area" role="log" aria-label="Chat conversation" aria-live="polite">
        {showWelcome ? (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <Zap size={34} color="#fff" />
            </div>
            <h1 className="welcome-title">How can I help with your EV today?</h1>
            <p className="welcome-subtitle">
              Ask me anything about EV charging — from calculating costs and time,
              to finding stations, planning trips, and troubleshooting issues.
            </p>
            <div className="suggestion-grid" role="list">
              {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  className="suggestion-card"
                  onClick={() => sendMessage(prompt)}
                  role="listitem"
                  aria-label={`Suggestion: ${label}`}
                >
                  <div className="suggestion-card-icon">
                    <Icon size={18} />
                  </div>
                  <div className="suggestion-card-title">{label}</div>
                  <div className="suggestion-card-desc">{prompt.slice(0, 55)}…</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            id="chat-input"
            className="chat-input"
            placeholder="Ask about charging, range, cost, stations…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label="Chat message input"
            disabled={isLoading}
            maxLength={4000}
          />
          <button
            id="btn-send"
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
          AI responses may not be perfectly accurate. Verify important info with your vehicle manual.
        </p>
      </div>
    </div>
  );
}
