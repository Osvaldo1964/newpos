import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowRightLeft, Eye, XCircle, Warehouse, Package, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { infoAlert, errorAlert } from '../../utils/swal';

const StockTransfers = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        from_warehouse_id: '',
        to_warehouse_id: '',
        observaciones: '',
        items: []
    });

    const [newItem, setNewItem] = useState({
        product_id: '',
        cantidad: 1,
        nombre: ''
    });

    const API_TRANSFERS = 'http://localhost/newpos/api/public/stock-transfers';
    const API_WAREHOUSES = 'http://localhost/newpos/api/public/inventory/warehouses';
    const API_PRODUCTS = 'http://localhost/newpos/api/public/inventory/products';

    useEffect(() => {
        fetchTransfers();
        fetchWarehouses();
        fetchProducts();
    }, []);

    const fetchTransfers = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(API_TRANSFERS, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem('pos_token');
                localStorage.removeItem('pos_user');
                window.location.reload();
                return;
            }

            const data = await res.json();
            setTransfers(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching transfers:', error);
            setTransfers([]);
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        const token = localStorage.getItem('pos_token');
        const res = await fetch(API_WAREHOUSES, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setWarehouses(data);
    };

    const fetchProducts = async () => {
        const token = localStorage.getItem('pos_token');
        const res = await fetch(API_PRODUCTS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setProducts(data);
    };

    const handleAddItem = () => {
        if (!newItem.product_id || newItem.cantidad <= 0) return;

        // Prevent adding same product twice in frontend list
        if (formData.items.some(i => i.product_id == newItem.product_id)) {
            infoAlert('Este producto ya está en la lista. Ajusta la cantidad directamente en la tabla.', 'Duplicado');
            return;
        }

        const product = products.find(p => p.id == newItem.product_id);
        const updatedItems = [...formData.items, {
            ...newItem,
            product_id: parseInt(newItem.product_id),
            nombre: product ? product.nombre : ''
        }];
        setFormData({ ...formData, items: updatedItems });
        setNewItem({ product_id: '', cantidad: 1, nombre: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            infoAlert('Debes agregar al menos un producto', 'Sin productos');
            return;
        }
        if (formData.from_warehouse_id === formData.to_warehouse_id) {
            infoAlert('La bodega de origen debe ser diferente a la bodega de destino', 'Bodegas iguales');
            return;
        }

        try {
            const token = localStorage.getItem('pos_token');
            const user = JSON.parse(localStorage.getItem('pos_user'));

            const url = isEditing ? `${API_TRANSFERS}/${editId}` : API_TRANSFERS;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    user_id: user.id
                })
            });

            if (res.ok) {
                setShowModal(false);
                setIsEditing(false);
                setEditId(null);
                setFormData({ from_warehouse_id: '', to_warehouse_id: '', observaciones: '', items: [] });
                fetchTransfers();
            } else {
                const err = await res.json();
                errorAlert(err.error || 'Error al procesar el traslado');
            }
        } catch (error) {
            console.error('Error saving transfer:', error);
        }
    };

    const handleEditTransfer = async (id) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_TRANSFERS}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            setFormData({
                from_warehouse_id: data.from_warehouse_id,
                to_warehouse_id: data.to_warehouse_id,
                observaciones: data.observaciones,
                items: data.items.map(i => ({
                    product_id: i.product_id,
                    cantidad: parseFloat(i.cantidad),
                    nombre: i.product_name
                }))
            });

            setEditId(id);
            setIsEditing(true);
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching details for edit:', error);
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_TRANSFERS}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSelectedTransfer(data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    const filteredTransfers = transfers.filter(t =>
        t.from_warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.to_warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toString().includes(searchTerm)
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h2 className="font-heading">Traslados entre Bodegas</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Mueve mercancía de una ubicación a otra de forma controlada</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setFormData({ from_warehouse_id: '', to_warehouse_id: '', observaciones: '', items: [] });
                    setIsEditing(false);
                    setEditId(null);
                    setShowModal(true);
                }}>
                    <ArrowRightLeft size={18} /> Nuevo Traslado
                </button>
            </div>

            <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por bodega u ID de traslado..."
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
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Desde</th>
                            <th>Hacia</th>
                            <th>Usuario</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Cargando traslados...</td></tr>
                        ) : transfers.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No se han realizado traslados</td></tr>
                        ) : (
                            filteredTransfers.map(t => (
                                <tr key={t.id}>
                                    <td>#{t.id}</td>
                                    <td>{new Date(t.fecha).toLocaleDateString()} {new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Warehouse size={14} color="#EF4444" />
                                            <span style={{ fontWeight: 600 }}>{t.from_warehouse_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Warehouse size={14} color="#10B981" />
                                            <span style={{ fontWeight: 600 }}>{t.to_warehouse_name}</span>
                                        </div>
                                    </td>
                                    <td>{t.user_name}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="btn-action edit" title="Editar Traslado" onClick={() => handleEditTransfer(t.id)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-action view" title="Ver Detalle" onClick={() => handleViewDetail(t.id)}>
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Nuevo Traslado */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '900px' }}>
                            <div className="modal-header">
                                <h3 className="font-heading">{isEditing ? `Editar Traslado #${editId}` : 'Registrar Nuevo Traslado'}</h3>
                                <button onClick={() => setShowModal(false)} className="btn-action"><XCircle size={20} /></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Bodega Origen (Donde sale el stock)</label>
                                            <select
                                                className="input-field"
                                                required
                                                value={formData.from_warehouse_id}
                                                onChange={e => setFormData({ ...formData, from_warehouse_id: e.target.value })}
                                            >
                                                <option value="">Seleccionar Origen...</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Bodega Destino (Donde entra el stock)</label>
                                            <select
                                                className="input-field"
                                                required
                                                value={formData.to_warehouse_id}
                                                onChange={e => setFormData({ ...formData, to_warehouse_id: e.target.value })}
                                            >
                                                <option value="">Seleccionar Destino...</option>
                                                {warehouses.map(w => (
                                                    <option key={w.id} value={w.id} disabled={w.id == formData.from_warehouse_id}>
                                                        {w.nombre} {w.id == formData.from_warehouse_id ? '(Origen)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Observaciones</label>
                                        <textarea
                                            className="input-field"
                                            style={{ height: '60px' }}
                                            value={formData.observaciones}
                                            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                                            placeholder="Motivo del traslado, número de camión, etc."
                                        />
                                    </div>

                                    <div className="glass" style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid var(--primary-light)' }}>
                                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Package size={18} /> Productos a Trasladar
                                        </h4>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem' }}>
                                            <div className="input-group">
                                                <label className="input-label">Producto</label>
                                                <select
                                                    className="input-field"
                                                    value={newItem.product_id}
                                                    onChange={e => setNewItem({ ...newItem, product_id: e.target.value })}
                                                >
                                                    <option value="">Seleccionar Producto...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Cantidad</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={newItem.cantidad}
                                                    onChange={e => setNewItem({ ...newItem, cantidad: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <button type="button" className="btn btn-primary" onClick={handleAddItem} style={{ height: '42px' }}>Añadir</button>
                                        </div>

                                        {formData.items.length > 0 && (
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Producto</th>
                                                        <th style={{ width: '120px' }}>Cantidad</th>
                                                        <th style={{ width: '40px' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formData.items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ fontWeight: 500 }}>{item.nombre}</td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="input-field"
                                                                    style={{ width: '100px', padding: '0.25rem' }}
                                                                    value={item.cantidad}
                                                                    onChange={e => {
                                                                        const updated = [...formData.items];
                                                                        updated[idx].cantidad = parseFloat(e.target.value);
                                                                        setFormData({ ...formData, items: updated });
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <button type="button" onClick={() => {
                                                                    const updated = formData.items.filter((_, i) => i !== idx);
                                                                    setFormData({ ...formData, items: updated });
                                                                }} className="btn-action delete" style={{ background: 'none' }}><XCircle size={16} /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ padding: '1.5rem 2rem' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                        {isEditing ? 'Actualizar Traslado' : 'Procesar Traslado'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Detalle */}
            <AnimatePresence>
                {showDetailModal && selectedTransfer && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h3 className="font-heading">Resumen Traslado #{selectedTransfer.id}</h3>
                                <button onClick={() => setShowDetailModal(false)} className="btn-action"><XCircle size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bodega Origen</p>
                                        <p style={{ fontWeight: 600, color: '#EF4444' }}>{selectedTransfer.from_warehouse_name}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bodega Destino</p>
                                        <p style={{ fontWeight: 600, color: '#10B981' }}>{selectedTransfer.to_warehouse_name}</p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Observaciones</p>
                                        <p>{selectedTransfer.observaciones || 'Sin observaciones'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realizado por</p>
                                        <p>{selectedTransfer.user_name}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fecha</p>
                                        <p>{new Date(selectedTransfer.fecha).toLocaleString()}</p>
                                    </div>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th style={{ textAlign: 'right' }}>Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTransfer.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.product_name} </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700 }}>{parseFloat(item.cantidad)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setShowDetailModal(false)} className="btn btn-primary">Entendido</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StockTransfers;
