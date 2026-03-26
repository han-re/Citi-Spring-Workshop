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
    if (!form.name.trim())     return setError('Name is required');
    if (!form.location.trim()) return setError('Location is required');
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
    <h2>Individuals</h2>

    {role === 'admin' && <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
        placeholder="Name *"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        style={{ padding: 8, flex: 1 }}
        />
        <input
        placeholder="Location *"
        value={form.location}
        onChange={e => setForm({ ...form, location: e.target.value })}
        style={{ padding: 8, flex: 1 }}
        />
        <select
        value={form.employment_type}
        onChange={e => setForm({ ...form, employment_type: e.target.value })}
        style={{ padding: 8 }}
        >
        {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit" style={btnPrimary}>{editId ? 'Update' : 'Add'}</button>
        {editId && (
        <button type="button" onClick={() => { setEditId(null); setForm({ name: '', location: '', employment_type: 'full-time' }); }} style={btnSecondary}>
            Cancel
        </button>
        )}
        {error && <span style={{ color: 'red', alignSelf: 'center' }}>{error}</span>}
    </form>}

    {/* SEARCH AND FILTER BAR */}
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
        placeholder="Search by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ padding: 8, flex: 2 }}
        />
        {/* LOCATION FILTER - BUILT FROM EXISTING RECORDS */}
        <select
        value={filterLocation}
        onChange={e => setFilterLocation(e.target.value)}
        style={{ padding: 8, flex: 1 }}
        >
        <option value="">All Locations</option>
        {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {/* EMPLOYMENT TYPE FILTER */}
        <select
        value={filterEmployment}
        onChange={e => setFilterEmployment(e.target.value)}
        style={{ padding: 8, flex: 1 }}
        >
        <option value="">All Employment Types</option>
        {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || filterLocation || filterEmployment) && (
        <button onClick={() => { setSearch(''); setFilterLocation(''); setFilterEmployment(''); }} style={btnSecondary}>
            Clear
        </button>
        )}
    </div>

    {loading ? <p>Loading...</p> : (
        <table width="100%" style={{ borderCollapse: 'collapse' }}>
        <thead>
            <tr style={{ background: '#f5f5f5' }}>
            <th style={th}>Name</th>
            <th style={th}>Location</th>
            <th style={th}>Employment Type</th>
            <th style={th}>Created</th>
            {role === 'admin' && <th style={th}>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {individuals.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>No individuals found</td></tr>
            )}
            {individuals.map(ind => (
            <tr key={ind._id}>
                <td style={td}>{ind.name}</td>
                <td style={td}>{ind.location}</td>
                <td style={td}>{ind.employment_type}</td>
                <td style={td}>{ind.created_at ? new Date(ind.created_at).toLocaleDateString() : '—'}</td>
                {role === 'admin' && (
                <td style={td}>
                  <button onClick={() => handleEdit(ind)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(ind._id)} style={{ color: 'red' }}>Delete</button>
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