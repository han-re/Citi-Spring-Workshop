import { useState, useEffect } from 'react';
import { individualsApi, teamsApi, achievementsApi, metadataApi } from '../services/api';

export default function Dashboard({ role, username }) {
const [counts, setCounts] = useState({ individuals: null, teams: null, achievements: null, metadata: null });
const [loading, setLoading] = useState(true);

useEffect(() => {
    async function fetchCounts() {
        const [ind, teams, ach, meta] = await Promise.all([
            individualsApi.list(),
            teamsApi.list(),
            achievementsApi.list(),
            metadataApi.list(),
        ]);
        setCounts({
            individuals:  Array.isArray(ind)   ? ind.length   : 0,
            teams:        Array.isArray(teams)  ? teams.length : 0,
            achievements: Array.isArray(ach)    ? ach.length   : 0,
            metadata:     Array.isArray(meta)   ? meta.length  : 0,
        });
        setLoading(false);
    }
    fetchCounts();
}, []);

const stats = [
    { label: 'Individuals', value: counts.individuals, color: '#00ff88', glow: '#00ff8840' },
    { label: 'Teams',       value: counts.teams,       color: '#00d4ff', glow: '#00d4ff40' },
    { label: 'Achievements',value: counts.achievements,color: '#ffaa00', glow: '#ffaa0040' },
    { label: 'Metadata',    value: counts.metadata,    color: '#ff00ff', glow: '#ff00ff40' },
];

return (
    <div>
        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6b7280', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>
                // SYSTEM OVERVIEW
            </div>
            <h2 style={{ fontFamily: 'Orbitron, monospace', fontSize: 16, color: '#00ff88', letterSpacing: '0.2em', textTransform: 'uppercase', textShadow: '0 0 10px rgba(0,255,136,0.4)', marginBottom: 4 }}>
                Dashboard
            </h2>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280', letterSpacing: '0.1em' }}>
                Logged in as <span style={{ color: '#e0e0e0' }}>{username}</span>
                {' '}·{' '}
                <span style={{ color: { admin: '#00ff88', manager: '#00d4ff', contributor: '#ffaa00', viewer: '#6b7280' }[role] }}>
                    [{role}]
                </span>
            </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
            {stats.map(s => (
            <div key={s.label} style={{ background: '#12121a', border: `1px solid ${s.color}40`, padding: '24px 20px', clipPath: 'polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))', boxShadow: `0 0 12px ${s.glow}` }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6b7280', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {s.label}
                </div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 36, color: s.color, textShadow: `0 0 12px ${s.glow}`, lineHeight: 1 }}>
                    {loading ? '—' : s.value}
                </div>
            </div>
            ))}
        </div>

        {/* ROLE PERMISSIONS TABLE */}
        <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6b7280', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>
                // ACCESS CONTROL MATRIX
            </div>
            <table width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead>
                <tr>
                    {['Role', 'Read', 'Create', 'Edit', 'Delete'].map(h => (
                    <th key={h} style={th}>{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {[
                    { role: 'admin',       color: '#00ff88', read: true,  create: true,  edit: true,  del: true  },
                    { role: 'manager',     color: '#00d4ff', read: true,  create: true,  edit: true,  del: false },
                    { role: 'contributor', color: '#ffaa00', read: true,  create: true,  edit: false, del: false },
                    { role: 'viewer',      color: '#6b7280', read: true,  create: false, edit: false, del: false },
                ].map(r => (
                    <tr key={r.role} style={{ background: r.role === role ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                        <td style={{ ...td, color: r.color, fontWeight: r.role === role ? 'bold' : 'normal' }}>
                            {r.role === role ? '› ' : ''}{r.role}
                        </td>
                        {[r.read, r.create, r.edit, r.del].map((allowed, i) => (
                        <td key={i} style={{ ...td, textAlign: 'center', color: allowed ? '#00ff88' : '#2a2a3a' }}>
                            {allowed ? '✓' : '✗'}
                        </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
);
}

const th = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #2a2a3a', color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 10, background: '#0a0a0f' };
const td = { padding: '10px 12px', borderBottom: '1px solid #1c1c2e', color: '#e0e0e0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 };
