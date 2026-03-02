import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle, XCircle, Package, LayoutDashboard, Calendar, Percent, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { errorAlert, confirmDialog } from '../../utils/swal';

const API = 'http://localhost/newpos/api/public';

const emptyForm = {
    nombre: '',
    tipo: 'PORCENTAJE',
    valor: '',
    fecha_inicio: '',
    fecha_fin: '',
    status: 1,
    product_ids: [],
    category_ids: []
};

const Promotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [scopeTab, setScopeTab] = useState('categories'); // 'categories' | 'products'

    const token = localStorage.getItem('pos_token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => { init(); }, []);

    const init = async () => {
        setLoading(true);
        await Promise.all([fetchPromotions(), fetchProducts(), fetchCategories()]);
        setLoading(false);
    };

    const fetchPromotions = async () => {
        const r = await fetch(`${API}/promotions`, { headers });
        if (r.ok) setPromotions(await r.json());
    };
    const fetchProducts = async () => {
        const r = await fetch(`${API}/inventory/products`, { headers });
        if (r.ok) setProducts(await r.json());
    };
    const fetchCategories = async () => {
        const r = await fetch(`${API}/categories`, { headers });
        if (r.ok) setCategories(await r.json());
    };

    const openCreate = () => { setEditing(null); setForm(emptyForm); setScopeTab('categories'); setShowModal(true); };
    const openEdit = (p) => {
        setEditing(p);
        setForm({
            nombre: p.nombre,
            tipo: p.tipo,
            valor: p.valor,
            fecha_inicio: p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '',
            fecha_fin: p.fecha_fin ? p.fecha_fin.split('T')[0] : '',
            status: p.status,
            product_ids: p.product_ids || [],
            category_ids: p.category_ids || []
        });
        setScopeTab('categories');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const targets = [
            ...form.category_ids.map(id => ({ type: 'CATEGORY', id })),
            ...form.product_ids.map(id => ({ type: 'PRODUCT', id }))
        ];
        const payload = {
            nombre: form.nombre,
            tipo: form.tipo,
            valor: parseFloat(form.valor),
            fecha_inicio: form.fecha_inicio || null,
            fecha_fin: form.fecha_fin || null,
            status: form.status,
            targets
        };

        const url = editing ? `${API}/promotions/${editing.id}` : `${API}/promotions`;
        const method = editing ? 'PUT' : 'POST';
        const r = await fetch(url, { method, headers, body: JSON.stringify(payload) });
        if (r.ok) { setShowModal(false); fetchPromotions(); }
        else { const d = await r.json(); errorAlert(d.error || 'Error al guardar'); }
    };

    const handleDelete = async (id) => {
        if (!(await confirmDialog('Esta acción no se puede deshacer.', '¿Eliminar promoción?', 'Sí, eliminar'))) return;
        await fetch(`${API}/promotions/${id}`, { method: 'DELETE', headers });
        fetchPromotions();
    };

    const toggleId = (field, id) => {
        setForm(f => ({
            ...f,
            [field]: f[field].includes(id) ? f[field].filter(x => x !== id) : [...f[field], id]
        }));
    };

    const getStatus = (p) => {
        if (!p.status) return { label: 'Inactiva', color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.1)' };
        const today = new Date().toISOString().split('T')[0];
        if (p.fecha_fin && p.fecha_fin < today) return { label: 'Vencida', color: 'var(--rose)', bg: 'rgba(244,63,94,0.1)' };
        return { label: 'Activa', color: 'var(--emerald)', bg: 'rgba(16,185,129,0.1)' };
    };

    const getScopeLabel = (p) => {
        const parts = [];
        if (p.category_names) parts.push(`Cat: ${p.category_names}`);
        if (p.product_names) parts.push(`Prod: ${p.product_names}`);
        return parts.length ? parts.join(' | ') : 'Global (toda la venta)';
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando promociones...</div>;

    return (
        <div className="component-fade-in">
            {/* Header */}
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem' }}>Promociones</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Gestiona descuentos por porcentaje o valor fijo aplicables a productos, categorías o toda la venta.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={18} /> Nueva Promoción
                </button>
            </div>

            {/* Table */}
            {promotions.length === 0 ? (
                <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
                    <Tag size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No hay promociones creadas aún.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                                <th>Vigencia</th>
                                <th>Alcance</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotions.map(p => {
                                const st = getStatus(p);
                                return (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                {p.tipo === 'PORCENTAJE' ? <Percent size={14} /> : <DollarSign size={14} />}
                                                {p.tipo}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                                            {p.tipo === 'PORCENTAJE' ? `${p.valor}%` : `$${Number(p.valor).toLocaleString('es-CO')}`}
                                        </td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '—'} → {p.fecha_fin ? p.fecha_fin.split('T')[0] : '∞'}
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                                            {getScopeLabel(p)}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block', padding: '0.2rem 0.6rem',
                                                borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                                                color: st.color, background: st.bg
                                            }}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem' }}>
                                                <button className="btn-action edit" onClick={() => openEdit(p)}><Edit2 size={15} /></button>
                                                <button className="btn-action delete" onClick={() => handleDelete(p.id)}><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            style={{ maxWidth: '620px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">{editing ? 'Editar' : 'Nueva'} Promoción</h3>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body" style={{ display: 'grid', gap: '1rem' }}>

                                    {/* Nombre */}
                                    <div className="input-group">
                                        <label className="input-label">Nombre</label>
                                        <input required className="input-field" value={form.nombre}
                                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                                    </div>

                                    {/* Tipo + Valor */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Tipo</label>
                                            <select className="input-field" value={form.tipo}
                                                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                                                <option value="PORCENTAJE">PORCENTAJE (%)</option>
                                                <option value="FIJO">FIJO ($)</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">
                                                Valor {form.tipo === 'PORCENTAJE' ? '(%)' : '($)'}
                                            </label>
                                            <input required type="number" min="0" step="0.01" className="input-field"
                                                value={form.valor}
                                                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                                        </div>
                                    </div>

                                    {/* Fechas */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Fecha Inicio</label>
                                            <input type="date" className="input-field" value={form.fecha_inicio}
                                                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Fecha Fin</label>
                                            <input type="date" className="input-field" value={form.fecha_fin}
                                                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <label className="input-label" style={{ marginBottom: 0 }}>Activa</label>
                                        <button type="button"
                                            onClick={() => setForm(f => ({ ...f, status: f.status ? 0 : 1 }))}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: form.status ? 'var(--emerald)' : 'var(--text-muted)'
                                            }}>
                                            {form.status ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                        </button>
                                    </div>

                                    {/* Alcance */}
                                    <div>
                                        <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                                            Alcance — <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                                                Sin selección = aplica a toda la venta (global)
                                            </span>
                                        </label>

                                        {/* Tabs */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            {[
                                                { key: 'categories', icon: <LayoutDashboard size={14} />, label: `Categorías (${form.category_ids.length})` },
                                                { key: 'products', icon: <Package size={14} />, label: `Productos (${form.product_ids.length})` }
                                            ].map(t => (
                                                <button key={t.key} type="button"
                                                    className={`btn ${scopeTab === t.key ? 'btn-primary' : 'btn-ghost'}`}
                                                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                                                    onClick={() => setScopeTab(t.key)}>
                                                    {t.icon}{t.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Scope list */}
                                        <div className="glass" style={{
                                            maxHeight: '180px', overflowY: 'auto',
                                            padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.4rem'
                                        }}>
                                            {scopeTab === 'categories'
                                                ? categories.map(c => (
                                                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={form.category_ids.includes(c.id)}
                                                            onChange={() => toggleId('category_ids', c.id)} />
                                                        {c.nombre}
                                                    </label>
                                                ))
                                                : products.map(p => (
                                                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={form.product_ids.includes(p.id)}
                                                            onChange={() => toggleId('product_ids', p.id)} />
                                                        {p.nombre}
                                                    </label>
                                                ))
                                            }
                                        </div>
                                    </div>

                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">
                                        <CheckCircle size={16} /> {editing ? 'Guardar Cambios' : 'Crear Promoción'}
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

export default Promotions;
