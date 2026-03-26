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
    if (!form.team_id)     return setError('Team is required');
    if (!form.month)       return setError('Month is required (YYYY-MM)');
    if (!/^\d{4}-\d{2}$/.test(form.month)) return setError('Month must be YYYY-MM format e.g. 2026-03');
    if (!form.description) return setError('Description is required');
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
    <h2>Achievements</h2>

    {role === 'admin' && <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {/* TEAM SELECTOR */}
        <select
            value={form.team_id}
            onChange={e => setForm({ ...form, team_id: e.target.value })}
            style={{ padding: 8, flex: 1 }}
        >
            <option value="">Select Team *</option>
            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        {/* MONTH INPUT - MUST BE YYYY-MM FORMAT */}
        <input
            placeholder="Month * (YYYY-MM e.g. 2026-03)"
            value={form.month}
            onChange={e => setForm({ ...form, month: e.target.value })}
            style={{ padding: 8, flex: 1 }}
        />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
            placeholder="Description *"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ padding: 8, flex: 2 }}
        />
        {/* OPTIONAL METRICS FIELD */}
        <input
            placeholder="Metrics (optional, e.g. 95% uptime)"
            value={form.metrics}
            onChange={e => setForm({ ...form, metrics: e.target.value })}
            style={{ padding: 8, flex: 1 }}
        />
        </div>
        <button type="submit" style={btnPrimary}>{editId ? 'Update' : 'Add'}</button>
        {editId && (
        <button type="button" onClick={() => { setEditId(null); setForm({ team_id: '', month: '', description: '', metrics: '' }); }} style={btnSecondary}>
            Cancel
        </button>
        )}
        {error && <span style={{ marginLeft: 8, color: 'red' }}>{error}</span>}
    </form>}

    {/* FILTER BAR */}
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <strong>Filter:</strong>
        <select
        value={filters.team_id}
        onChange={e => setFilters({ ...filters, team_id: e.target.value })}
        style={{ padding: 8 }}
        >
        <option value="">All Teams</option>
        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <input
        placeholder="Month (YYYY-MM)"
        value={filters.month}
        onChange={e => setFilters({ ...filters, month: e.target.value })}
        style={{ padding: 8, width: 160 }}
        />
        {(filters.team_id || filters.month) && (
        <button onClick={() => setFilters({ team_id: '', month: '' })} style={btnSecondary}>Clear</button>
        )}
    </div>

    {loading ? <p>Loading...</p> : (
        <table width="100%" style={{ borderCollapse: 'collapse' }}>
        <thead>
            <tr style={{ background: '#f5f5f5' }}>
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
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>No achievements found</td></tr>
            )}
            {achievements.map(a => (
            <tr key={a._id}>
                <td style={td}>{getTeamName(a.team_id)}</td>
                <td style={td}>{a.month}</td>
                <td style={td}>{a.description}</td>
                <td style={td}>{a.metrics || '—'}</td>
                <td style={td}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                {role === 'admin' && (
                <td style={td}>
                  <button onClick={() => handleEdit(a)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(a._id)} style={{ color: 'red' }}>Delete</button>
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

const th = { padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' };
const td = { padding: '10px 8px', borderBottom: '1px solid #eee' };
const btnPrimary   = { padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' };
const btnSecondary = { padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff' };