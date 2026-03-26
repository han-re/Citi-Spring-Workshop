import { useState, useEffect } from 'react';
import { individualsApi } from '../services/api';
import { useToast, ToastContainer } from '../components/Toast';

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contractor'];

export default function Individuals({ role }) {
const [individuals, setIndividuals] = useState([]);
const [form, setForm]               = useState({ name: '', location: '', employment_type: 'full-time' });
const [editId, setEditId]           = useState(null);
const [error, setError]             = useState('');
const [loading, setLoading]         = useState(false);
const [search, setSearch]           = useState('');
const [filterLocation, setFilterLocation]     = useState('');
const [filterEmployment, setFilterEmployment] = useState('');
const { toasts, showToast } = useToast();

// RE-FETCH WHENEVER SEARCH OR FILTERS CHANGE
useEffect(() => { load(); }, [search, filterLocation, filterEmployment]);

async function load() {
    setLoading(true);
    const params = {};
    if (search)           params.search          = search;
    if (filterLocation)   params.location        = filterLocation;
    if (filterEmployment) params.employment_type = filterEmployment;
    const data = await individualsApi.list(params);
    setIndividuals(Array.isArray(data) ? data : []);
    setLoading(false);
}

async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim())     return setError('name is required');
    if (!form.location.trim()) return setError('location is required');
    try {
    if (editId) {
        await individualsApi.update(editId, form);
        showToast('Individual updated successfully');
        setEditId(null);
    } else {
        await individualsApi.create(form);
        showToast('Individual created successfully');
    }
    setForm({ name: '', location: '', employment_type: 'full-time' });
    load();
    } catch {
    showToast('Something went wrong', 'error');
    }
}

async function handleDelete(id) {
    if (!confirm('Delete this individual?')) return;
    await individualsApi.remove(id);
    showToast('Individual deleted');
    load();
}

function handleEdit(ind) {
    setEditId(ind._id);
    setForm({ name: ind.name, location: ind.location, employment_type: ind.employment_type });
}

// BUILD LOCATION OPTIONS FROM EXISTING DATA
const locations = [...new Set(individuals.map(i => i.location).filter(Boolean))];

return (
    <div>
    <ToastContainer toasts={toasts} />
    <h2 style={pageHeading}>Individuals</h2>

    {role === 'admin' && <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="> name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ ...inp, flex: 1 }} />
        <input placeholder="> location *" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ ...inp, flex: 1 }} />
        <select value={form.employment_type} onChange={e => setForm({ ...form, employment_type: e.target.value })} style={sel}>
        {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit" style={btnPrimary}>{editId ? 'update' : 'add'}</button>
        {editId && (
        <button type="button" onClick={() => { setEditId(null); setForm({ name: '', location: '', employment_type: 'full-time' }); }} style={btnSecondary}>cancel</button>
        )}
        {error && <span style={errText}>{error}</span>}
    </form>}

    {/* SEARCH AND FILTER BAR */}
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="> search by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, flex: 2 }} />
        {/* LOCATION FILTER - BUILT FROM EXISTING RECORDS */}
        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={sel}>
        <option value="">all locations</option>
        {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {/* EMPLOYMENT TYPE FILTER */}
        <select value={filterEmployment} onChange={e => setFilterEmployment(e.target.value)} style={sel}>
        <option value="">all types</option>
        {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || filterLocation || filterEmployment) && (
        <button onClick={() => { setSearch(''); setFilterLocation(''); setFilterEmployment(''); }} style={btnSecondary}>clear</button>
        )}
    </div>

    {loading ? <p style={loadingText}>// LOADING...</p> : (
        <table width="100%" style={{ borderCollapse: 'collapse' }} className="cyber-table">
        <thead>
            <tr>
            <th style={th}>Name</th>
            <th style={th}>Location</th>
            <th style={th}>Type</th>
            <th style={th}>Created</th>
            {role === 'admin' && <th style={th}>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {individuals.length === 0 && (
            <tr><td colSpan={role === 'admin' ? 5 : 4} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>// NO RECORDS FOUND</td></tr>
            )}
            {individuals.map(ind => (
            <tr key={ind._id}>
                <td style={td}>{ind.name}</td>
                <td style={td}>{ind.location}</td>
                <td style={{ ...td, color: '#00d4ff' }}>{ind.employment_type}</td>
                <td style={{ ...td, color: '#6b7280' }}>{ind.created_at ? new Date(ind.created_at).toLocaleDateString() : '—'}</td>
                {role === 'admin' && (
                <td style={td}>
                  <button onClick={() => handleEdit(ind)} style={{ ...btnEdit, marginRight: 8 }}>edit</button>
                  <button onClick={() => handleDelete(ind._id)} style={btnDanger}>del</button>
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
