import { useState, useEffect } from 'react';

export function useToast() {
const [toasts, setToasts] = useState([]);

function showToast(message, type = 'success') {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
}

return { toasts, showToast };
}

export function ToastContainer({ toasts }) {
return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {toasts.map(t => (
        <div key={t.id} style={{
        padding: '12px 20px',
        borderRadius: 6,
        background: t.type === 'success' ? '#22c55e' : '#ef4444',
        color: '#fff',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
        {t.message}
        </div>
    ))}
    </div>
);
}