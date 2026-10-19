import { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';

// Hooks
import { useEVProfile } from './hooks/useEVProfile.js';
import { useChatHistory } from './hooks/useChatHistory.js';

// Layout components
import Sidebar from './components/Sidebar.jsx';
import RightPanel from './components/RightPanel.jsx';

// Pages
import ChatPage from './pages/ChatPage.jsx';
import ChargingTimePage from './pages/ChargingTimePage.jsx';
import CostPage from './pages/CostPage.jsx';
import RangePage from './pages/RangePage.jsx';
import StationsPage from './pages/StationsPage.jsx';
import TripPage from './pages/TripPage.jsx';
import TroubleshootingPage from './pages/TroubleshootingPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const PAGE_TITLES = {
  chat: 'AI Chat',
  'charging-time': 'Charging Time Calculator',
  cost: 'Charging Cost Calculator',
  range: 'Range Estimator',
  stations: 'Charging Stations',
  trip: 'Trip Planner',
  troubleshoot: 'Troubleshooting',
  profile: 'EV Profile',
  settings: 'Settings',
};

export default function App() {
  const [activePage, setActivePage] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { profile, apiProfile, hasProfile, saveProfile, resetProfile } = useEVProfile();
  const {
    sessions, activeSession, activeSessionId,
    newChat, addMessage, renameSession, deleteSession, switchSession,
  } = useChatHistory();

  // Ensure a session exists when chat page loads
  const ensureSession = useCallback(() => {
    if (!activeSession) return newChat();
    return activeSession;
  }, [activeSession, newChat]);

  function handleNavigate(page) {
    if (page === 'chat') ensureSession();
    setActivePage(page);
    setSidebarOpen(false);
  }

  function handleNewChat() {
    newChat();
    setActivePage('chat');
  }

  function handleAddMessage(role, content, calcCtx = null) {
    if (!activeSessionId) {
      newChat();
    }
    addMessage(role, content, calcCtx);
  }

  const showRightPanel = activePage === 'chat';

  function renderPage() {
    switch (activePage) {
      case 'chat':
        return (
          <ChatPage
            activeSession={activeSession || ensureSession()}
            onAddMessage={handleAddMessage}
            apiProfile={apiProfile}
            onNavigate={handleNavigate}
          />
        );
      case 'charging-time':
        return <ChargingTimePage apiProfile={apiProfile} />;
      case 'cost':
        return <CostPage apiProfile={apiProfile} />;
      case 'range':
        return <RangePage apiProfile={apiProfile} />;
      case 'stations':
        return <StationsPage />;
      case 'trip':
        return <TripPage apiProfile={apiProfile} />;
      case 'troubleshoot':
        return <TroubleshootingPage />;
      case 'profile':
        return <ProfilePage profile={profile} onSave={saveProfile} onReset={resetProfile} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ChatPage activeSession={activeSession} onAddMessage={handleAddMessage} apiProfile={apiProfile} onNavigate={handleNavigate} />;
    }
  }

  return (
    <div className="app-shell">
      {/* Left Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSwitchSession={(id) => { switchSession(id); setActivePage('chat'); }}
        onRenameSession={renameSession}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu size={20} />
          </button>
          <h2 className="topbar-title">{PAGE_TITLES[activePage] || 'EV Charging Assistant'}</h2>
          {hasProfile && (
            <div className="topbar-status">
              <div className="status-dot online" />
              <span>{profile.make} {profile.model}</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {renderPage()}
          </div>

          {/* Right panel (chat only, hidden on narrow screens via CSS) */}
          {showRightPanel && <RightPanel profile={profile} />}
        </div>
      </div>
    </div>
  );
}
