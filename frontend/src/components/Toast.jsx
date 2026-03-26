import { useState } from 'react';

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
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {toasts.map(t => (
        <div key={t.id} style={{
        padding: '10px 16px',
        background: '#12121a',
        border: `1px solid ${t.type === 'success' ? '#00ff88' : '#ff3366'}`,
        color: t.type === 'success' ? '#00ff88' : '#ff3366',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        letterSpacing: '0.08em',
        boxShadow: t.type === 'success' ? '0 0 10px #00ff8840' : '0 0 10px #ff336640',
        clipPath: 'polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))',
        minWidth: 240,
        }}>
        {t.type === 'success' ? '✓ ' : '✗ '}{t.message}
        </div>
    ))}
    </div>
);
}
