/**
 * useChatHistory — localStorage-backed chat session management.
 * Supports: new chat, rename, delete, restore, list recent.
 */
import { useState, useCallback } from 'react';

const HISTORY_KEY = 'ev_chat_history';
const MAX_SESSIONS = 20;

function loadSessions() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {}
}

function createSession(firstMessage = '') {
  return {
    id: `chat_${Date.now()}`,
    title: firstMessage ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '…' : '') : 'New Chat',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useChatHistory() {
  const [sessions, setSessions] = useState(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const s = loadSessions();
    return s.length > 0 ? s[0].id : null;
  });

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const persistAndSet = useCallback((next) => {
    setSessions(next);
    saveSessions(next);
  }, []);

  const newChat = useCallback(() => {
    const session = createSession();
    const next = [session, ...sessions];
    persistAndSet(next);
    setActiveSessionId(session.id);
    return session;
  }, [sessions, persistAndSet]);

  const addMessage = useCallback((role, content, calcContext = null) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const msg = { role, content, calcContext, timestamp: new Date().toISOString() };
        const messages = [...s.messages, msg];
        // Auto-title from first user message
        const title =
          s.title === 'New Chat' && role === 'user'
            ? content.slice(0, 45) + (content.length > 45 ? '…' : '')
            : s.title;
        return { ...s, messages, title, updatedAt: new Date().toISOString() };
      });
      saveSessions(next);
      return next;
    });
  }, [activeSessionId]);

  const renameSession = useCallback((id, newTitle) => {
    const next = sessions.map((s) => (s.id === id ? { ...s, title: newTitle } : s));
    persistAndSet(next);
  }, [sessions, persistAndSet]);

  const deleteSession = useCallback((id) => {
    const next = sessions.filter((s) => s.id !== id);
    persistAndSet(next);
    if (activeSessionId === id) {
      setActiveSessionId(next.length > 0 ? next[0].id : null);
    }
  }, [sessions, persistAndSet, activeSessionId]);

  const switchSession = useCallback((id) => {
    setActiveSessionId(id);
  }, []);

  const clearAll = useCallback(() => {
    persistAndSet([]);
    setActiveSessionId(null);
  }, [persistAndSet]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    newChat,
    addMessage,
    renameSession,
    deleteSession,
    switchSession,
    clearAll,
  };
}
