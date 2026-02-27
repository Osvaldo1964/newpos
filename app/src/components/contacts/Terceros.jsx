import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users, User, Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Tag, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Terceros = () => {
    const [terceros, setTerceros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTercero, setEditingTercero] = useState(null);

    const [formData, setFormData] = useState({
        documento: '',
        tipo_documento: 'CC',
        tipo_persona: 'Natural',
        nombre: '',
        razon_social: '',
        email: '',
        telefono: '',
        direccion: '',
        es_cliente: true,
        es_proveedor: false
    });

    const API_URL = 'http://localhost/newpos/api/public/terceros';

    useEffect(() => {
        fetchTerceros();
    }, []);

    const fetchTerceros = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTerceros(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching terceros:', error);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('pos_token');
            const method = editingTercero ? 'PUT' : 'POST';
            const url = editingTercero ? `${API_URL}/${editingTercero.id}` : API_URL;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                setEditingTercero(null);
                setFormData({
                    documento: '',
                    tipo_documento: 'CC',
                    tipo_persona: 'Natural',
                    nombre: '',
                    razon_social: '',
                    email: '',
                    telefono: '',
                    direccion: '',
                    es_cliente: true,
                    es_proveedor: false
                });
                fetchTerceros();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving tercero:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchTerceros();
        } catch (error) {
            console.error('Error deleting tercero:', error);
        }
    };

    const handleEdit = (tercero) => {
        setEditingTercero(tercero);
        setFormData({
            documento: tercero.documento,
            tipo_documento: tercero.tipo_documento,
            tipo_persona: tercero.tipo_persona,
            nombre: tercero.nombre,
            razon_social: tercero.razon_social || '',
            email: tercero.email || '',
            telefono: tercero.telefono || '',
            direccion: tercero.direccion || '',
            es_cliente: Boolean(tercero.es_cliente),
            es_proveedor: Boolean(tercero.es_proveedor)
        });
        setShowModal(true);
    };

    const filteredTerceros = terceros.filter(t =>
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.documento.includes(searchTerm) ||
        (t.razon_social && t.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h2 className="font-heading">Gestión de Terceros</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Administra clientes y proveedores en un solo lugar</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingTercero(null); setFormData({ documento: '', tipo_documento: 'CC', tipo_persona: 'Natural', nombre: '', razon_social: '', email: '', telefono: '', direccion: '', es_cliente: true, es_proveedor: false }); setShowModal(true); }}>
                    <Plus size={18} /> Nuevo Tercero
                </button>
            </div>

            <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, documento o razón social..."
                        className="input-field"
                        style={{ paddingLeft: '3rem', width: '100%' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Nombre / Razón Social</th>
                            <th>Tipo</th>
                            <th>Contacto</th>
                            <th>Roles</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</td></tr>
                        ) : filteredTerceros.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron terceros</td></tr>
                        ) : (
                            filteredTerceros.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{t.documento}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.tipo_documento}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{t.nombre}</div>
                                        {t.razon_social && <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{t.razon_social}</div>}
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(30, 58, 138, 0.1)', color: 'var(--primary)' }}>
                                            {t.tipo_persona === 'Natural' ? <User size={12} style={{ marginRight: '4px' }} /> : <Building2 size={12} style={{ marginRight: '4px' }} />}
                                            {t.tipo_persona}
                                        </span>
                                    </td>
                                    <td>
                                        {t.email && <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {t.email}</div>}
                                        {t.telefono && <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {t.telefono}</div>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {Boolean(t.es_cliente) && <span className="badge badge-green">CLIENTE</span>}
                                            {Boolean(t.es_proveedor) && <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}>PROVEEDOR</span>}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="btn-action edit" onClick={() => handleEdit(t)}><Edit2 size={16} /></button>
                                            <button className="btn-action delete" onClick={() => handleDelete(t.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Formulario */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            style={{ maxWidth: '600px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">{editingTercero ? 'Editar' : 'Nuevo'} Tercero</h3>
                                <button onClick={() => setShowModal(false)} className="btn-action"><XCircle size={20} /></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Tipo de Persona</label>
                                            <select
                                                className="input-field"
                                                value={formData.tipo_persona}
                                                onChange={(e) => setFormData({ ...formData, tipo_persona: e.target.value })}
                                            >
                                                <option value="Natural">Natural</option>
                                                <option value="Jurídica">Jurídica</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Tipo Documento</label>
                                            <select
                                                className="input-field"
                                                value={formData.tipo_documento}
                                                onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                                            >
                                                <option value="CC">Cédula de Ciudadanía</option>
                                                <option value="NIT">NIT</option>
                                                <option value="CE">Cédula de Extranjería</option>
                                                <option value="PP">Pasaporte</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Número de Documento</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.documento}
                                            onChange={(e) => setFormData({ ...formData, documento: e.target.value.toUpperCase() })}
                                        />
                                    </div>

                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Nombre Completo / Contacto</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                                        />
                                    </div>

                                    {formData.tipo_persona === 'Jurídica' && (
                                        <div className="input-group" style={{ marginTop: '1rem' }}>
                                            <label className="input-label">Razón Social</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.razon_social}
                                                onChange={(e) => setFormData({ ...formData, razon_social: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                className="input-field"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Teléfono</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.telefono}
                                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Dirección</label>
                                        <textarea
                                            className="input-field"
                                            rows="2"
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.es_cliente}
                                                onChange={(e) => setFormData({ ...formData, es_cliente: e.target.checked })}
                                            />
                                            Es Cliente
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.es_proveedor}
                                                onChange={(e) => setFormData({ ...formData, es_proveedor: e.target.checked })}
                                            />
                                            Es Proveedor
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">
                                        <CheckCircle size={18} /> {editingTercero ? 'Actualizar' : 'Guardar'} Tercero
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Terceros;
