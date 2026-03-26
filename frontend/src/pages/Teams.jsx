import { useState, useEffect } from 'react';
import { teamsApi, individualsApi } from '../services/api';
import { useToast, ToastContainer } from '../components/Toast';

export default function Teams({ role }) {
const [teams, setTeams]             = useState([]);
const [individuals, setIndividuals] = useState([]);
const [form, setForm]               = useState({ name: '', location: '', leader_id: '', members: [] });
const [editId, setEditId]           = useState(null);
const [error, setError]             = useState('');
const [loading, setLoading]         = useState(false);
const { toasts, showToast }         = useToast();

useEffect(() => { load(); }, []);

// LOAD TEAMS AND INDIVIDUALS IN PARALLEL
async function load() {
    setLoading(true);
    const [t, i] = await Promise.all([teamsApi.list(), individualsApi.list()]);
    setTeams(Array.isArray(t) ? t : []);
    setIndividuals(Array.isArray(i) ? i : []);
    setLoading(false);
}

async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim())  return setError('name is required');
    if (!form.leader_id)    return setError('leader is required');
    try {
    if (editId) {
        await teamsApi.update(editId, form);
        showToast('Team updated successfully');
        setEditId(null);
    } else {
        await teamsApi.create(form);
        showToast('Team created successfully');
    }
    setForm({ name: '', location: '', leader_id: '', members: [] });
    load();
    } catch {
    showToast('Something went wrong', 'error');
    }
}

async function handleDelete(id) {
    if (!confirm('Delete this team?')) return;
    await teamsApi.remove(id);
    showToast('Team deleted');
    load();
}

function handleEdit(team) {
    setEditId(team._id);
    setForm({ name: team.name, location: team.location || '', leader_id: team.leader_id, members: team.members || [] });
}

// TOGGLE MEMBER SELECTION - ADD OR REMOVE FROM MEMBERS ARRAY
function toggleMember(id) {
    setForm(f => ({
    ...f,
    members: f.members.includes(id)
        ? f.members.filter(m => m !== id)
        : [...f.members, id]
    }));
}

// LOOK UP INDIVIDUAL NAME BY ID FOR DISPLAY
const getName = id => individuals.find(i => i._id === id)?.name || id;

return (
    <div>
    <ToastContainer toasts={toasts} />
    <h2 style={pageHeading}>Teams</h2>

    {role === 'admin' && <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: '#12121a', border: '1px solid #2a2a3a', padding: 16, clipPath: 'polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder="> team name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ ...inp, flex: 1 }} />
        <input placeholder="> location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ ...inp, flex: 1 }} />
        {/* LEADER DROPDOWN - POPULATED FROM INDIVIDUALS */}
        <select value={form.leader_id} onChange={e => setForm({ ...form, leader_id: e.target.value })} style={sel}>
            <option value="">select leader *</option>
            {individuals.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>
        </div>

        {/* MEMBER CHECKBOXES - LEADER IS AUTO-ADDED BY BACKEND */}
        <div style={{ marginBottom: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280', letterSpacing: '0.1em' }}>
        <span style={{ color: '#00ff88', marginRight: 12 }}>// MEMBERS:</span>
        {individuals.map(i => (
            <label key={i._id} style={{ marginRight: 16, color: form.leader_id === i._id ? '#00ff88' : '#e0e0e0', cursor: 'pointer' }}>
            <input
                type="checkbox"
                checked={form.members.includes(i._id) || form.leader_id === i._id}
                disabled={form.leader_id === i._id} // LEADER ALWAYS A MEMBER
                onChange={() => toggleMember(i._id)}
                style={{ accentColor: '#00ff88', marginRight: 4 }}
            />
            {i.name}
            {form.leader_id === i._id && <span style={{ color: '#6b7280' }}> [leader]</span>}
            </label>
        ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="submit" style={btnPrimary}>{editId ? 'update' : 'add'}</button>
        {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm({ name: '', location: '', leader_id: '', members: [] }); }} style={btnSecondary}>cancel</button>
        )}
        {error && <span style={errText}>{error}</span>}
        </div>
    </form>}

    {loading ? <p style={loadingText}>// LOADING...</p> : (
        <table width="100%" style={{ borderCollapse: 'collapse' }} className="cyber-table">
        <thead>
            <tr>
            <th style={th}>Name</th>
            <th style={th}>Location</th>
            <th style={th}>Leader</th>
            <th style={th}>Members</th>
            <th style={th}>Created</th>
            {role === 'admin' && <th style={th}>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {teams.length === 0 && (
            <tr><td colSpan={role === 'admin' ? 6 : 5} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>// NO TEAMS FOUND</td></tr>
            )}
            {teams.map(t => (
            <tr key={t._id}>
                <td style={td}>{t.name}</td>
                <td style={{ ...td, color: '#6b7280' }}>{t.location || '—'}</td>
                <td style={{ ...td, color: '#00ff88' }}>{getName(t.leader_id)}</td>
                <td style={{ ...td, color: '#00d4ff', fontSize: 11 }}>{(t.members || []).map(m => getName(m)).join(', ') || '—'}</td>
                <td style={{ ...td, color: '#6b7280' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                {role === 'admin' && (
                <td style={td}>
                  <button onClick={() => handleEdit(t)} style={{ ...btnEdit, marginRight: 8 }}>edit</button>
                  <button onClick={() => handleDelete(t._id)} style={btnDanger}>del</button>
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
