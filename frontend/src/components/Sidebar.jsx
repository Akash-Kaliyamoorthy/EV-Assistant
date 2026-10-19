import { useState, useRef, useEffect } from 'react';
import {
  Zap, Plus, MessageSquare, Calculator, BatteryCharging, DollarSign,
  MapPin, Route, User, Settings, Trash2, Edit3, ChevronDown, Menu, X, Wrench
} from 'lucide-react';
import { timeAgo } from '../utils/formatting';

const NAV_ITEMS = [
  { id: 'chat',           label: 'AI Chat',           icon: MessageSquare },
  { id: 'charging-time',  label: 'Charging Calculator',icon: Calculator },
  { id: 'cost',           label: 'Cost Calculator',    icon: DollarSign },
  { id: 'range',          label: 'Range Estimator',    icon: BatteryCharging },
  { id: 'stations',       label: 'Charging Stations',  icon: MapPin },
  { id: 'trip',           label: 'Trip Planner',       icon: Route },
  { id: 'troubleshoot',   label: 'Troubleshooting',    icon: Wrench },
];

export default function Sidebar({
  activePage, onNavigate,
  sessions, activeSessionId,
  onNewChat, onSwitchSession, onRenameSession, onDeleteSession,
  isOpen, onClose,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef(null);

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus();
  }, [renamingId]);

  function startRename(session, e) {
    e.stopPropagation();
    setRenamingId(session.id);
    setRenameValue(session.title);
  }

  function commitRename(id) {
    if (renameValue.trim()) onRenameSession(id, renameValue.trim());
    setRenamingId(null);
  }

  function handleDelete(id, e) {
    e.stopPropagation();
    if (window.confirm('Delete this chat?')) onDeleteSession(id);
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`} role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <div className="sidebar-logo-text">EV Assistant</div>
            <div className="sidebar-logo-sub">AI-Powered Charging</div>
          </div>
          <button
            className="sidebar-item"
            style={{ marginLeft: 'auto', padding: '6px', display: 'none' }}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat */}
        <button
          id="btn-new-chat"
          className="sidebar-new-chat"
          onClick={() => { onNewChat(); onNavigate('chat'); onClose?.(); }}
          aria-label="Start a new chat"
        >
          <Plus size={16} /> New Chat
        </button>

        {/* Main nav */}
        <div className="sidebar-nav">
          <span className="sidebar-section-label">Tools</span>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`nav-${id}`}
              className={`sidebar-item ${activePage === id ? 'active' : ''}`}
              onClick={() => { onNavigate(id); onClose?.(); }}
              aria-current={activePage === id ? 'page' : undefined}
            >
              <Icon size={16} className="item-icon" />
              {label}
            </button>
          ))}

          {/* Chat history */}
          {sessions.length > 0 && (
            <>
              <span className="sidebar-section-label" style={{ marginTop: 10 }}>Recent Chats</span>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`sidebar-item sidebar-history-item ${activeSessionId === session.id && activePage === 'chat' ? 'active' : ''}`}
                  onClick={() => { onSwitchSession(session.id); onNavigate('chat'); onClose?.(); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onSwitchSession(session.id)}
                  title={session.title}
                >
                  {renamingId === session.id ? (
                    <input
                      ref={renameRef}
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(session.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(session.id);
                        if (e.key === 'Escape') setRenamingId(null);
                        e.stopPropagation();
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="item-title">{session.title}</span>
                  )}
                  <div className="sidebar-history-actions">
                    <button
                      className="sidebar-history-action"
                      onClick={e => startRename(session, e)}
                      title="Rename"
                      aria-label="Rename chat"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      className="sidebar-history-action"
                      onClick={e => handleDelete(session.id, e)}
                      title="Delete"
                      aria-label="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Bottom nav */}
        <div className="sidebar-bottom">
          <button
            id="nav-profile"
            className={`sidebar-item ${activePage === 'profile' ? 'active' : ''}`}
            onClick={() => { onNavigate('profile'); onClose?.(); }}
          >
            <User size={16} className="item-icon" /> EV Profile
          </button>
          <button
            id="nav-settings"
            className={`sidebar-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => { onNavigate('settings'); onClose?.(); }}
          >
            <Settings size={16} className="item-icon" /> Settings
          </button>
        </div>
      </aside>
    </>
  );
}
