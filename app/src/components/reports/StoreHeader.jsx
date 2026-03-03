import React, { useState, useEffect } from 'react';

const API = 'http://localhost/newpos/api/public';

export default function StoreHeader() {
    const [config, setConfig] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API}/p/store-info`);
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                }
            } catch (error) {
                console.error("Failed to load store config for header", error);
            }
        };
        fetchConfig();
    }, []);

    if (!config) return null;

    return (
        <div className="store-header-print" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid var(--border-color)',
            pageBreakInside: 'avoid'
        }}>
            {config.logo_url && (
                <img
                    src={config.logo_url}
                    alt="Logo"
                    style={{
                        maxHeight: '80px',
                        maxWidth: '200px',
                        objectFit: 'contain'
                    }}
                />
            )}
            <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>{config.nombre}</h2>
                {config.slogan && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{config.slogan}</p>}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {config.nit && <span><strong>NIT:</strong> {config.nit}</span>}
                    {config.telefono && <span><strong>Tel:</strong> {config.telefono}</span>}
                    {config.direccion && <span><strong>Dir:</strong> {config.direccion} {config.ciudad && `- ${config.ciudad}`}</span>}
                </div>
            </div>
        </div>
    );
}
