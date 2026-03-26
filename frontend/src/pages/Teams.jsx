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
    if (!form.name.trim())  return setError('Name is required');
    if (!form.leader_id)    return setError('Leader is required');
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
    <h2>Teams</h2>

    {role === 'admin' && <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
            placeholder="Team Name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ padding: 8, flex: 1 }}
        />
        <input
            placeholder="Location"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            style={{ padding: 8, flex: 1 }}
        />
        {/* LEADER DROPDOWN - POPULATED FROM INDIVIDUALS */}
        <select
            value={form.leader_id}
            onChange={e => setForm({ ...form, leader_id: e.target.value })}
            style={{ padding: 8, flex: 1 }}
        >
            <option value="">Select Leader *</option>
            {individuals.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>
        </div>

        {/* MEMBER CHECKBOXES - LEADER IS AUTO-ADDED BY BACKEND */}
        <div style={{ marginBottom: 8 }}>
        <strong>Members:</strong>{' '}
        {individuals.map(i => (
            <label key={i._id} style={{ marginRight: 12 }}>
            <input
                type="checkbox"
                checked={form.members.includes(i._id) || form.leader_id === i._id}
                disabled={form.leader_id === i._id} // LEADER ALWAYS A MEMBER
                onChange={() => toggleMember(i._id)}
            />{' '}{i.name}
            {form.leader_id === i._id && ' (Leader)'}
            </label>
        ))}
        </div>

        <button type="submit" style={btnPrimary}>{editId ? 'Update' : 'Add'}</button>
        {editId && (
        <button type="button" onClick={() => { setEditId(null); setForm({ name: '', location: '', leader_id: '', members: [] }); }} style={btnSecondary}>
            Cancel
        </button>
        )}
        {error && <span style={{ marginLeft: 8, color: 'red' }}>{error}</span>}
    </form>}

    {loading ? <p>Loading...</p> : (
        <table width="100%" style={{ borderCollapse: 'collapse' }}>
        <thead>
            <tr style={{ background: '#f5f5f5' }}>
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
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>No teams yet</td></tr>
            )}
            {teams.map(t => (
            <tr key={t._id}>
                <td style={td}>{t.name}</td>
                <td style={td}>{t.location || '—'}</td>
                <td style={td}>{getName(t.leader_id)}</td>
                <td style={td}>{(t.members || []).map(m => getName(m)).join(', ') || '—'}</td>
                <td style={td}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                {role === 'admin' && (
                <td style={td}>
                  <button onClick={() => handleEdit(t)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(t._id)} style={{ color: 'red' }}>Delete</button>
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