import { useState } from 'react';
import Individuals  from './pages/Individuals';
import Teams        from './pages/Teams';
import Achievements from './pages/Achievements';
import Metadata     from './pages/Metadata';
import Login        from './pages/Login';

const PAGES = ['Individuals', 'Teams', 'Achievements', 'Metadata'];

export default function App() {
  const [page, setPage]         = useState('Individuals');
  // INITIALISE FROM LOCALSTORAGE SO SESSION SURVIVES PAGE REFRESH
  const [role, setRole]         = useState(localStorage.getItem('role') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);

  // CALLED BY LOGIN PAGE AFTER SUCCESSFUL AUTH
  function handleLogin(newRole, newUsername) {
    setRole(newRole);
    setUsername(newUsername);
  }

  // CLEAR ALL AUTH STATE AND RETURN TO LOGIN SCREEN
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setRole(null);
    setUsername(null);
  }

  // NO TOKEN = SHOW LOGIN PAGE
  if (!role) return <Login onLogin={handleLogin} />;

  const renderPage = () => {
    // PASS role DOWN SO EACH PAGE CAN SHOW/HIDE EDIT CONTROLS
    switch (page) {
      case 'Individuals':  return <Individuals  role={role} />;
      case 'Teams':        return <Teams        role={role} />;
      case 'Achievements': return <Achievements role={role} />;
      case 'Metadata':     return <Metadata     role={role} />;
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px' }}>

      {/* HEADER */}
      <div style={{ borderBottom: '1px solid #2a2a3a', paddingBottom: 16, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6 }}>
            // ACME CORPORATION
          </div>
          <h1 className="cyber-glitch" style={{ fontFamily: 'Orbitron, monospace', fontSize: 20, color: '#00ff88', letterSpacing: '0.15em', textTransform: 'uppercase', textShadow: '0 0 10px rgba(0,255,136,0.5)' }}>
            Team Management
          </h1>
        </div>

        {/* USER BADGE + LOGOUT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {username}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2, color: { admin: '#00ff88', manager: '#00d4ff', contributor: '#ffaa00', viewer: '#6b7280' }[role] || '#6b7280', textShadow: role === 'admin' ? '0 0 6px #00ff88' : 'none' }}>
              [{role}]
            </div>
          </div>
          <button onClick={handleLogout} style={btnOutline}>
            logout
          </button>
        </div>
      </div>

      {/* ROLE NOTICE - SHOWS FOR NON-ADMIN ROLES */}
      {role === 'viewer' && (
        <div style={{ border: '1px solid #ff00ff', background: 'rgba(255,0,255,0.05)', padding: '8px 14px', marginBottom: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#ff00ff', letterSpacing: '0.1em', clipPath: 'polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))', boxShadow: '0 0 8px #ff00ff40' }}>
          ⚠ VIEWER MODE — READ ACCESS ONLY
        </div>
      )}
      {role === 'contributor' && (
        <div style={{ border: '1px solid #ffaa00', background: 'rgba(255,170,0,0.05)', padding: '8px 14px', marginBottom: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#ffaa00', letterSpacing: '0.1em', clipPath: 'polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))', boxShadow: '0 0 8px #ffaa0040' }}>
          ◈ CONTRIBUTOR MODE — CREATE ACCESS ONLY
        </div>
      )}
      {role === 'manager' && (
        <div style={{ border: '1px solid #00d4ff', background: 'rgba(0,212,255,0.05)', padding: '8px 14px', marginBottom: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#00d4ff', letterSpacing: '0.1em', clipPath: 'polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))', boxShadow: '0 0 8px #00d4ff40' }}>
          ◈ MANAGER MODE — CREATE AND EDIT ACCESS
        </div>
      )}

      {/* NAV TABS */}
      <nav style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #2a2a3a' }}>
        {PAGES.map(p => (
          <button key={p} onClick={() => setPage(p)} style={page === p ? tabActive : tabInactive}>
            {p}
          </button>
        ))}
      </nav>

      {renderPage()}
    </div>
  );
}

const chamferSm = 'polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))';

const tabActive = {
  padding: '8px 18px',
  background: 'rgba(0,255,136,0.06)',
  color: '#00ff88',
  border: '1px solid #00ff88',
  borderBottom: '2px solid #0a0a0f',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  cursor: 'pointer',
  boxShadow: '0 0 8px #00ff8830',
  marginBottom: -1,
};

const tabInactive = {
  padding: '8px 18px',
  background: 'transparent',
  color: '#6b7280',
  border: '1px solid transparent',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  cursor: 'pointer',
  marginBottom: -1,
};

const btnOutline = {
  padding: '6px 14px',
  background: 'transparent',
  color: '#6b7280',
  border: '1px solid #2a2a3a',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  cursor: 'pointer',
  clipPath: chamferSm,
};
