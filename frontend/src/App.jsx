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
  if (!role) {
    return <Login onLogin={handleLogin} />;
  }

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
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}>

      {/* HEADER ROW - TITLE LEFT, USER INFO + LOGOUT RIGHT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>ACME Team Management</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            {username}
            {' · '}
            <strong style={{ color: role === 'admin' ? '#0070f3' : '#888' }}>
              {role}
            </strong>
          </span>
          <button
            onClick={handleLogout}
            style={{ padding: '6px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff', fontSize: 13 }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* VIEWER NOTICE - SHOWS ONLY WHEN NOT AN ADMIN */}
      {role !== 'admin' && (
        <p style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>
          You are in <strong>viewer mode</strong> — read only.
        </p>
      )}

      <nav style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {PAGES.map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              padding: '8px 16px',
              background: page === p ? '#0070f3' : '#eee',
              color: page === p ? '#fff' : '#000',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
      </nav>

      {renderPage()}
    </div>
  );
}
