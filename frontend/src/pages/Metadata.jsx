import { useState, useEffect } from 'react';
import { metadataApi } from '../services/api';
import { useToast, ToastContainer } from '../components/Toast';

// SUGGESTED CATEGORIES BASED ON THE SPEC
const CATEGORIES = ['individual', 'team', 'organisation'];

export default function Metadata({ role }) {
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
    if (!form.category.trim()) return setError('Category is required');
    if (!form.key.trim())      return setError('Key is required');
    if (!form.value.trim())    return setError('Value is required');
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
    <h2>Metadata</h2>
    <p style={{ color: '#666', marginTop: 0 }}>
        Reference data organised by category. Example: category=<em>individual</em>, key=<em>employment_type</em>, value=<em>contractor</em>
    </p>

    {role === 'admin' && <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* CATEGORY - DROPDOWN WITH SPEC-DEFINED OPTIONS PLUS FREE TEXT */}
        <select
        value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}
        style={{ padding: 8, flex: 1 }}
        >
        <option value="">Select Category *</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
        placeholder="Key * (e.g. employment_type)"
        value={form.key}
        onChange={e => setForm({ ...form, key: e.target.value })}
        style={{ padding: 8, flex: 1 }}
        />
        <input
        placeholder="Value * (e.g. contractor)"
        value={form.value}
        onChange={e => setForm({ ...form, value: e.target.value })}
        style={{ padding: 8, flex: 1 }}
        />
        <button type="submit" style={btnPrimary}>{editId ? 'Update' : 'Add'}</button>
        {editId && (
        <button type="button" onClick={() => { setEditId(null); setForm({ category: '', key: '', value: '' }); }} style={btnSecondary}>
            Cancel
        </button>
        )}
        {error && <span style={{ color: 'red', alignSelf: 'center' }}>{error}</span>}
    </form>}

    {loading ? <p>Loading...</p> : (
        Object.keys(grouped).length === 0
        ? <p>No metadata yet. Add reference data above.</p>
        : Object.entries(grouped).map(([category, items]) => (
            <div key={category} style={{ marginBottom: 24 }}>
            {/* EACH CATEGORY RENDERED AS ITS OWN TABLE */}
            <h3 style={{ textTransform: 'capitalize', borderBottom: '2px solid #ddd', paddingBottom: 4 }}>
                {category}
            </h3>
            <table width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ background: '#f5f5f5' }}>
                    <th style={th}>Key</th>
                    <th style={th}>Value</th>
                    <th style={th}>Created</th>
                    {role === 'admin' && <th style={th}>Actions</th>}
                </tr>
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item._id}>
                    <td style={td}>{item.key}</td>
                    <td style={td}>{item.value}</td>
                    <td style={td}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                    {role === 'admin' && (
                    <td style={td}>
                      <button onClick={() => handleEdit(item)} style={{ marginRight: 8 }}>Edit</button>
                      <button onClick={() => handleDelete(item._id)} style={{ color: 'red' }}>Delete</button>
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

const th = { padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' };
const td = { padding: '10px 8px', borderBottom: '1px solid #eee' };
const btnPrimary   = { padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' };
const btnSecondary = { padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff' };