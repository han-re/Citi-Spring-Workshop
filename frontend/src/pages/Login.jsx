import { useState } from 'react';
import { authApi } from '../services/api';

export default function Login({ onLogin }) {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(form.username, form.password);
      if (data && data.token) {
        // STORE TOKEN AND USER INFO IN LOCALSTORAGE - PERSISTS ACROSS PAGE REFRESHES
        localStorage.setItem('token',    data.token);
        localStorage.setItem('role',     data.role);
        localStorage.setItem('username', data.username);
        onLogin(data.role, data.username);
      } else {
        setError((data && data.error) || 'ACCESS DENIED');
      }
    } catch {
      setError('CONNECTION FAILED — CHECK SERVER STATUS');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* CORP HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 12 }}>
            // ACME CORPORATION
          </div>
          <h1 className="cyber-glitch" style={{ fontFamily: 'Orbitron, monospace', fontSize: 26, color: '#00ff88', letterSpacing: '0.2em', textTransform: 'uppercase', textShadow: '0 0 20px rgba(0,255,136,0.5), 0 0 40px rgba(0,255,136,0.2)', marginBottom: 8 }}>
            TEAM MGMT
          </h1>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280', letterSpacing: '0.2em' }}>
            SECURE ACCESS TERMINAL <span className="blink-cursor" />
          </div>
        </div>

        {/* LOGIN CARD */}
        <div style={{ background: '#12121a', border: '1px solid #2a2a3a', clipPath: 'polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px))', padding: 32 }}>

          {/* TERMINAL HEADER BAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #2a2a3a' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3366' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffaa00' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280', letterSpacing: '0.2em', marginLeft: 8 }}>
              AUTH.SYS v2.1
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* USERNAME */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6b7280', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
                IDENTIFIER
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, pointerEvents: 'none' }}>›</span>
                <input
                  placeholder="username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  autoFocus
                  style={inputStyle}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6b7280', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
                AUTH KEY
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, pointerEvents: 'none' }}>›</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ff3366', letterSpacing: '0.1em', marginBottom: 16, padding: '8px 12px', border: '1px solid #ff336640', background: 'rgba(255,51,102,0.05)', boxShadow: '0 0 8px #ff336620' }}>
                ✗ {error}
              </div>
            )}

            {/* SUBMIT */}
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? 'AUTHENTICATING...' : '> INITIALISE SESSION'}
            </button>
          </form>
        </div>

        {/* DEMO HINT */}
        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2a2a3a', letterSpacing: '0.1em' }}>
          admin/admin123 · viewer/viewer123
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px 10px 28px',
  background: '#0a0a0f',
  border: '1px solid #2a2a3a',
  color: '#e0e0e0',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 13,
  letterSpacing: '0.05em',
  boxSizing: 'border-box',
};

const submitBtn = {
  width: '100%',
  padding: '12px',
  background: 'transparent',
  border: '1px solid #00ff88',
  color: '#00ff88',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  cursor: 'pointer',
  clipPath: 'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))',
  boxShadow: '0 0 5px #00ff8830',
  transition: 'all 150ms',
};
