import { useState, useEffect } from 'react';
import { achievementsApi, teamsApi } from '../services/api';
import { useToast, ToastContainer } from '../components/Toast';

export default function Achievements({ role }) {
const [achievements, setAchievements] = useState([]);
const [teams, setTeams]               = useState([]);
const [form, setForm]                 = useState({ team_id: '', month: '', description: '', metrics: '' });
const [editId, setEditId]             = useState(null);
const [filters, setFilters]           = useState({ team_id: '', month: '' });
const [error, setError]               = useState('');
const [loading, setLoading]           = useState(false);
const { toasts, showToast }           = useToast();

useEffect(() => { loadTeams(); }, []);
useEffect(() => { loadAchievements(); }, [filters]); // RE-FETCH WHEN FILTERS CHANGE

async function loadTeams() {
    const t = await teamsApi.list();
    setTeams(Array.isArray(t) ? t : []);
}

async function loadAchievements() {
    setLoading(true);
    const params = {};
    if (filters.team_id) params.team_id = filters.team_id;
    if (filters.month)   params.month   = filters.month;
    const data = await achievementsApi.list(params);
    setAchievements(Array.isArray(data) ? data : []);
    setLoading(false);
}

async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    // FRONTEND VALIDATION BEFORE SENDING TO BACKEND
    if (!form.team_id)     return setError('team is required');
    if (!form.month)       return setError('month is required (YYYY-MM)');
    if (!/^\d{4}-\d{2}$/.test(form.month)) return setError('month must be YYYY-MM format e.g. 2026-03');
    if (!form.description) return setError('description is required');
    try {
    const payload = { ...form };
    if (!payload.metrics) delete payload.metrics; // OMIT EMPTY OPTIONAL FIELD
    if (editId) {
        await achievementsApi.update(editId, payload);
        showToast('Achievement updated successfully');
        setEditId(null);
    } else {
        await achievementsApi.create(payload);
        showToast('Achievement created successfully');
    }
    setForm({ team_id: '', month: '', description: '', metrics: '' });
    loadAchievements();
    } catch {
    showToast('Something went wrong', 'error');
    }
}

async function handleDelete(id) {
    if (!confirm('Delete this achievement?')) return;
    await achievementsApi.remove(id);
    showToast('Achievement deleted');
    loadAchievements();
}

function handleEdit(a) {
    setEditId(a._id);
    setForm({ team_id: a.team_id, month: a.month, description: a.description, metrics: a.metrics || '' });
}

const getTeamName = id => teams.find(t => t._id === id)?.name || id;

return (
    <div>
    <ToastContainer toasts={toasts} />
    <h2 style={pageHeading}>Achievements</h2>

    {role === 'admin' && <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: '#12121a', border: '1px solid #2a2a3a', padding: 16, clipPath: 'polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {/* TEAM SELECTOR */}
        <select value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })} style={{ ...sel, flex: 1 }}>
            <option value="">select team *</option>
            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        {/* MONTH INPUT - MUST BE YYYY-MM FORMAT */}
        <input placeholder="> month * (YYYY-MM)" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} style={{ ...inp, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input placeholder="> description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, flex: 2 }} />
        {/* OPTIONAL METRICS FIELD */}
        <input placeholder="> metrics (optional)" value={form.metrics} onChange={e => setForm({ ...form, metrics: e.target.value })} style={{ ...inp, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="submit" style={btnPrimary}>{editId ? 'update' : 'add'}</button>
        {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm({ team_id: '', month: '', description: '', metrics: '' }); }} style={btnSecondary}>cancel</button>
        )}
        {error && <span style={errText}>{error}</span>}
        </div>
    </form>}

    {/* FILTER BAR */}
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280', letterSpacing: '0.1em' }}>
        <span style={{ color: '#00ff88' }}>// FILTER:</span>
        <select value={filters.team_id} onChange={e => setFilters({ ...filters, team_id: e.target.value })} style={sel}>
        <option value="">all teams</option>
        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <input placeholder="> month (YYYY-MM)" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} style={{ ...inp, width: 160 }} />
        {(filters.team_id || filters.month) && (
        <button onClick={() => setFilters({ team_id: '', month: '' })} style={btnSecondary}>clear</button>
        )}
    </div>

    {loading ? <p style={loadingText}>// LOADING...</p> : (
        <table width="100%" style={{ borderCollapse: 'collapse' }} className="cyber-table">
        <thead>
            <tr>
            <th style={th}>Team</th>
            <th style={th}>Month</th>
            <th style={th}>Description</th>
            <th style={th}>Metrics</th>
            <th style={th}>Created</th>
            {role === 'admin' && <th style={th}>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {achievements.length === 0 && (
            <tr><td colSpan={role === 'admin' ? 6 : 5} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>// NO ACHIEVEMENTS FOUND</td></tr>
            )}
            {achievements.map(a => (
            <tr key={a._id}>
                <td style={{ ...td, color: '#00ff88' }}>{getTeamName(a.team_id)}</td>
                <td style={{ ...td, color: '#00d4ff' }}>{a.month}</td>
                <td style={td}>{a.description}</td>
                <td style={{ ...td, color: '#6b7280' }}>{a.metrics || '—'}</td>
                <td style={{ ...td, color: '#6b7280' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                {role === 'admin' && (
                <td style={td}>
                  <button onClick={() => handleEdit(a)} style={{ ...btnEdit, marginRight: 8 }}>edit</button>
                  <button onClick={() => handleDelete(a._id)} style={btnDanger}>del</button>
                </td>
                )}
            </tr>
            ))}
        </tbody>
        </table>
    )}
    </div>
);
}

const chamfer = 'polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))';
const pageHeading  = { fontFamily: 'Orbitron, monospace', fontSize: 14, color: '#00ff88', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, textShadow: '0 0 8px rgba(0,255,136,0.4)' };
const th           = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #2a2a3a', color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 10, background: '#0a0a0f' };
const td           = { padding: '10px 12px', borderBottom: '1px solid #1c1c2e', color: '#e0e0e0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 };
const inp          = { padding: '8px 12px', background: '#12121a', border: '1px solid #2a2a3a', color: '#e0e0e0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 };
const sel          = { padding: '8px 10px', background: '#12121a', border: '1px solid #2a2a3a', color: '#e0e0e0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 };
const btnPrimary   = { padding: '8px 16px', background: 'transparent', color: '#00ff88', border: '1px solid #00ff88', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11, cursor: 'pointer', clipPath: chamfer, boxShadow: '0 0 5px #00ff8830' };
const btnSecondary = { padding: '8px 16px', background: 'transparent', color: '#6b7280', border: '1px solid #2a2a3a', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11, cursor: 'pointer', clipPath: chamfer };
const btnEdit      = { padding: '5px 12px', background: 'transparent', color: '#00d4ff', border: '1px solid #00d4ff40', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, cursor: 'pointer', clipPath: chamfer };
const btnDanger    = { padding: '5px 12px', background: 'transparent', color: '#ff3366', border: '1px solid #ff336640', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, cursor: 'pointer', clipPath: chamfer };
const errText      = { color: '#ff3366', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, alignSelf: 'center', letterSpacing: '0.05em' };
const loadingText  = { color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: '0.1em' };
