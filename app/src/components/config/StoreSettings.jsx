import React, { useState, useEffect, useRef } from 'react';
import { Store, Save, Upload, Key, MapPin, Phone, Mail, Image as ImageIcon, Building2, CreditCard } from 'lucide-react';
import * as swal from '../../utils/swal';

const API = 'http://localhost/newpos/api/public';

export default function StoreSettings() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const loadConfig = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API}/store-config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (error) {
            swal.errorAlert('Error al cargar la configuración de la tienda');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadConfig(); }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API}/store-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                swal.toast('Configuración guardada exitosamente', 'success');
            } else {
                throw new Error('Error saving');
            }
        } catch (error) {
            swal.errorAlert('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        try {
            swal.toast('Subiendo logo...', 'info');
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API}/store-config/logo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setConfig(prev => ({ ...prev, logo_url: data.logo_url }));
                swal.toast('Logo actualizado', 'success');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            swal.errorAlert('Error al subir el logo');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando configuración...</div>;
    if (!config) return <div style={{ padding: '2rem', textAlign: 'center' }}>Error al cargar los datos.</div>;

    return (
        <div className="component-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 className="font-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Store size={28} style={{ color: 'var(--primary)' }} /> Datos de la Tienda
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Configuración general y credenciales de pagos para el E-commerce.</p>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem', alignItems: 'start' }}>

                {/* Main Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* General Info */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building2 size={18} /> Información Pública
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Nombre de la Tienda</label>
                                <input type="text" className="input-field" name="nombre" value={config.nombre || ''} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Slogan (opcional)</label>
                                <input type="text" className="input-field" name="slogan" value={config.slogan || ''} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">NIT / Documento</label>
                                <input type="text" className="input-field" name="nit" value={config.nit || ''} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Ciudad</label>
                                <input type="text" className="input-field" name="ciudad" value={config.ciudad || ''} onChange={handleChange} />
                            </div>
                            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Dirección Física</label>
                                <input type="text" className="input-field" name="direccion" value={config.direccion || ''} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Teléfono / WhatsApp</label>
                                <input type="text" className="input-field" name="telefono" value={config.telefono || ''} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email de Contacto</label>
                                <input type="email" className="input-field" name="email" value={config.email || ''} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* API Keys */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Key size={18} /> Integraciones y Pagos
                        </h3>

                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{ width: 14 }} /> Google OAuth</h4>
                            <div className="input-group">
                                <label className="input-label">Google Client ID</label>
                                <input type="text" className="input-field" name="google_client_id" value={config.google_client_id || ''} onChange={handleChange} placeholder="xxx.apps.googleusercontent.com" />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CreditCard size={14} /> Wompi (Bancolombia)</h4>
                            <div className="input-group">
                                <label className="input-label">Public Key</label>
                                <input type="text" className="input-field" name="wompi_public_key" value={config.wompi_public_key || ''} onChange={handleChange} placeholder="pub_test_..." />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#A3E635', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CreditCard size={14} /> PayU Latam</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Merchant ID</label>
                                    <input type="text" className="input-field" name="payu_merchant_id" value={config.payu_merchant_id || ''} onChange={handleChange} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Account ID</label>
                                    <input type="text" className="input-field" name="payu_account_id" value={config.payu_account_id || ''} onChange={handleChange} />
                                </div>
                                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">API Key</label>
                                    <input type="text" className="input-field" name="payu_api_key" value={config.payu_api_key || ''} onChange={handleChange} />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input type="checkbox" name="payu_test" checked={config.payu_test === 1} onChange={handleChange} style={{ width: 16, height: 16 }} />
                                    Modo Sandbox (Test)
                                </label>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CreditCard size={14} /> MercadoPago</h4>
                            <div className="input-group">
                                <label className="input-label">Public Key</label>
                                <input type="text" className="input-field" name="mercadopago_public_key" value={config.mercadopago_public_key || ''} onChange={handleChange} placeholder="TEST-..." />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Sidebar Setup */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Logo Section */}
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', color: 'var(--text-main)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ImageIcon size={18} /> Logo de la Tienda
                        </h3>

                        <div style={{
                            width: '180px', height: '180px', margin: '0 auto 1.5rem',
                            border: '2px dashed #E2E8F0', borderRadius: 'var(--radius-lg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', backgroundColor: '#F8FAFC', padding: '1rem'
                        }}>
                            {config.logo_url ? (
                                <img src={config.logo_url.startsWith('http') ? config.logo_url : `http://localhost${config.logo_url}`} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin logo</span>
                            )}
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleLogoUpload}
                        />
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <Upload size={16} /> Subir Logo
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }} disabled={saving}>
                            <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.4 }}>
                            Estos datos se mostrarán en la tienda pública y en la cabecera de los reportes impresos.
                        </p>
                    </div>

                </div>

            </form>
        </div>
    );
}
