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
        setError((data && data.error) || 'Login failed');
      }
    } catch {
      setError('Login failed - check the server is running');
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: 32, border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>ACME Team Management</h2>
      <p style={{ color: '#666', marginTop: 0, marginBottom: 24 }}>Sign in to continue</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            autoFocus
            style={{ width: '100%', padding: 10, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ width: '100%', padding: 10, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
          />
        </div>

        {error && <p style={{ color: 'red', margin: '0 0 12px', fontSize: 14 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 10, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* HINT FOR DEMO - REMOVE BEFORE PRODUCTION */}
      <p style={{ color: '#999', fontSize: 12, marginTop: 20, marginBottom: 0 }}>
        Demo: <strong>admin</strong> / admin123 &nbsp;|&nbsp; <strong>viewer</strong> / viewer123
      </p>
    </div>
  );
}
