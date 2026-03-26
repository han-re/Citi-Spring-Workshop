import { useState, useEffect } from 'react';
import { metadataApi } from '../services/api';
import { useToast, ToastContainer } from '../components/Toast';

// SUGGESTED CATEGORIES BASED ON THE SPEC
const CATEGORIES = ['individual', 'team', 'organisation'];

export default function Metadata({ role }) {
const canCreate = ['admin', 'manager', 'contributor'].includes(role);
const canEdit   = ['admin', 'manager'].includes(role);
const canDelete = role === 'admin';
const [grouped, setGrouped] = useState({});
const [form, setForm]       = useState({ category: '', key: '', value: '' });
const [editId, setEditId]   = useState(null);
const [error, setError]     = useState('');
const [loading, setLoading] = useState(false);
const { toasts, showToast } = useToast();

useEffect(() => { load(); }, []);

async function load() {
    setLoading(true);
    const data = await metadataApi.list();
    // BACKEND RETURNS OBJECT GROUPED BY CATEGORY
    setGrouped(data && typeof data === 'object' && !Array.isArray(data) ? data : {});
    setLoading(false);
}

async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.category.trim()) return setError('category is required');
    if (!form.key.trim())      return setError('key is required');
    if (!form.value.trim())    return setError('value is required');
    try {
    if (editId) {
        await metadataApi.update(editId, form);
        showToast('Metadata updated successfully');
        setEditId(null);
    } else {
        await metadataApi.create(form);
        showToast('Metadata created successfully');
    }
    setForm({ category: '', key: '', value: '' });
    load();
    } catch {
    showToast('Something went wrong', 'error');
    }
}

async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return;
    await metadataApi.remove(id);
    showToast('Metadata deleted');
    load();
}

function handleEdit(item) {
    setEditId(item._id);
    setForm({ category: item.category, key: item.key, value: item.value });
}

return (
    <div>
    <ToastContainer toasts={toasts} />
    <h2 style={pageHeading}>Metadata</h2>
    <p style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.08em', marginTop: 0, marginBottom: 20 }}>
        // reference data by category — e.g. category=<span style={{ color: '#00d4ff' }}>individual</span>, key=<span style={{ color: '#00d4ff' }}>employment_type</span>, value=<span style={{ color: '#00d4ff' }}>contractor</span>
    </p>

    {canCreate && <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* CATEGORY - DROPDOWN WITH SPEC-DEFINED OPTIONS */}
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={sel}>
        <option value="">select category *</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="> key * (e.g. employment_type)" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} style={{ ...inp, flex: 1 }} />
        <input placeholder="> value * (e.g. contractor)" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} style={{ ...inp, flex: 1 }} />
        <button type="submit" style={btnPrimary}>{editId ? 'update' : 'add'}</button>
        {editId && (
        <button type="button" onClick={() => { setEditId(null); setForm({ category: '', key: '', value: '' }); }} style={btnSecondary}>cancel</button>
        )}
        {error && <span style={errText}>{error}</span>}
    </form>}

    {loading ? <p style={loadingText}>// LOADING...</p> : (
        Object.keys(grouped).length === 0
        ? <p style={loadingText}>// NO METADATA YET — ADD REFERENCE DATA ABOVE</p>
        : Object.entries(grouped).map(([category, items]) => (
            <div key={category} style={{ marginBottom: 32 }}>
            {/* EACH CATEGORY RENDERED AS ITS OWN TABLE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #2a2a3a' }}>
                <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 11, color: '#00ff88', letterSpacing: '0.2em', textTransform: 'uppercase', textShadow: '0 0 6px rgba(0,255,136,0.4)' }}>
                [{category}]
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#2a2a3a' }}>
                {'─'.repeat(20)}
                </span>
            </div>
            <table width="100%" style={{ borderCollapse: 'collapse' }} className="cyber-table">
                <thead>
                <tr>
                    <th style={th}>Key</th>
                    <th style={th}>Value</th>
                    <th style={th}>Created</th>
                    {canEdit && <th style={th}>Actions</th>}
                </tr>
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item._id}>
                    <td style={{ ...td, color: '#00d4ff' }}>{item.key}</td>
                    <td style={td}>{item.value}</td>
                    <td style={{ ...td, color: '#6b7280' }}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                    {canEdit && (
                    <td style={td}>
                      {canEdit && <button onClick={() => handleEdit(item)} style={{ ...btnEdit, marginRight: 8 }}>edit</button>}
                      {canDelete && <button onClick={() => handleDelete(item._id)} style={btnDanger}>del</button>}
                    </td>
                    )}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        ))
    )}
    </div>
);
}

const chamfer = 'polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))';
const pageHeading  = { fontFamily: 'Orbitron, monospace', fontSize: 14, color: '#00ff88', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, textShadow: '0 0 8px rgba(0,255,136,0.4)' };
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
