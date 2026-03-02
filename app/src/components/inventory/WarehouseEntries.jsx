import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingBag, CheckCircle, Eye, Truck, Warehouse, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { infoAlert, errorAlert, confirmDialog } from '../../utils/swal';

const WarehouseEntries = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [formData, setFormData] = useState({
        orden_id: '',
        tercero_id: '',
        warehouse_id: '',
        num_remision: '',
        observaciones: '',
        items: []
    });

    const [newItem, setNewItem] = useState({
        product_id: '',
        cantidad: 1,
        nombre: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const API_ENTRADAS = 'http://localhost/newpos/api/public/compras/entradas';
    const API_ORDENES = 'http://localhost/newpos/api/public/compras/ordenes';
    const API_TERCEROS = 'http://localhost/newpos/api/public/terceros';
    const API_WAREHOUSES = 'http://localhost/newpos/api/public/inventory/warehouses';
    const API_PRODUCTS = 'http://localhost/newpos/api/public/inventory/products';

    useEffect(() => {
        fetchEntries();
        fetchSuppliers();
        fetchWarehouses();
        fetchProducts();
    }, []);

    const fetchEntries = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(API_ENTRADAS, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setEntries(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching entries:', error);
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        const token = localStorage.getItem('pos_token');
        const res = await fetch(API_TERCEROS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSuppliers(data.filter(t => Boolean(t.es_proveedor)));
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

    const fetchPendingOrders = async (tercero_id) => {
        if (!tercero_id) return;
        const token = localStorage.getItem('pos_token');
        const res = await fetch(`${API_ORDENES}?tercero_id=${tercero_id}&estado=PENDIENTE,PARCIAL`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setPendingOrders(data);
    };

    const handleSelectOrder = async (orderId) => {
        if (!orderId) {
            setFormData({ ...formData, orden_id: '', items: [] });
            return;
        }
        const token = localStorage.getItem('pos_token');
        const res = await fetch(`${API_ORDENES}/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const order = await res.json();

        // Auto-fill items with pending quantity
        const itemsToReceive = order.items
            .filter(item => item.cantidad_pedida > item.cantidad_recibida)
            .map(item => ({
                product_id: item.product_id,
                nombre: item.product_name,
                cantidad: item.cantidad_pedida - item.cantidad_recibida
            }));

        setFormData({
            ...formData,
            orden_id: orderId,
            items: itemsToReceive
        });
    };

    const handleAddItem = () => {
        if (!newItem.product_id || newItem.cantidad <= 0) return;
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

        try {
            const token = localStorage.getItem('pos_token');
            const url = isEditing ? `${API_ENTRADAS}/${editId}` : API_ENTRADAS;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                setIsEditing(false);
                setEditId(null);
                setFormData({ orden_id: '', tercero_id: '', warehouse_id: '', num_remision: '', observaciones: '', items: [] });
                fetchEntries();
            } else {
                const err = await res.json();
                errorAlert(err.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving entry:', error);
        }
    };

    const handleEditEntry = async (entry) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_ENTRADAS}/${entry.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const fullEntry = await res.json();

            setFormData({
                orden_id: fullEntry.orden_id || '',
                tercero_id: fullEntry.tercero_id,
                warehouse_id: fullEntry.warehouse_id,
                num_remision: fullEntry.num_remision || '',
                observaciones: fullEntry.observaciones || '',
                items: fullEntry.items.map(i => ({
                    product_id: i.product_id,
                    nombre: i.product_name,
                    cantidad: parseFloat(i.cantidad)
                }))
            });
            setIsEditing(true);
            setEditId(entry.id);
            setShowModal(true);

            if (fullEntry.tercero_id) {
                fetchPendingOrders(fullEntry.tercero_id);
            }
        } catch (error) {
            console.error('Error loading entry for edit:', error);
        }
    };

    const handleDeleteEntry = async (id) => {
        if (!(await confirmDialog(
            '¿Estás seguro? El stock será revertido y las cantidades recibidas de la OC serán restadas.',
            '¿Eliminar entrada?', 'Sí, eliminar'
        ))) return;
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_ENTRADAS}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchEntries();
            } else {
                const err = await res.json();
                errorAlert(err.error || 'No se pudo eliminar la entrada');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_ENTRADAS}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSelectedEntry(data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    return (
        <div className="component-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h2 className="font-heading">Entradas a Bodega</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Registro real de ingreso de mercancía al inventario</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setFormData({ orden_id: '', tercero_id: '', warehouse_id: '', num_remision: '', observaciones: '', items: [] });
                    setIsEditing(false);
                    setEditId(null);
                    setShowModal(true);
                }}>
                    <Plus size={18} /> Nueva Entrada
                </button>
            </div>

            <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por proveedor, remisión o bodega..."
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
                            <th>Fecha</th>
                            <th>Proveedor</th>
                            <th>Bodega</th>
                            <th>Remisión</th>
                            <th>Usuario</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron entradas</td></tr>
                        ) : (
                            entries.map(entry => (
                                <tr key={entry.id}>
                                    <td>{new Date(entry.fecha).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>{entry.tercero_nombre}</td>
                                    <td>{entry.warehouse_name}</td>
                                    <td>{entry.num_remision || 'N/A'}</td>
                                    <td>{entry.user_name}</td>
                                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button className="btn-action edit" title="Ver Detalle" onClick={() => handleViewDetail(entry.id)}><Eye size={16} /></button>
                                        <button className="btn-action edit" title="Editar" onClick={() => handleEditEntry(entry)} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><Truck size={16} /></button>
                                        <button className="btn-action delete" title="Eliminar (Revertir)" onClick={() => handleDeleteEntry(entry.id)}><XCircle size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Nueva Entrada */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '1000px' }}>
                            <div className="modal-header">
                                <h3 className="font-heading">{isEditing ? `Editar Entrada #${editId}` : 'Registrar Entrada a Bodega'}</h3>
                                <button onClick={() => setShowModal(false)} className="btn-action"><XCircle size={20} /></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Proveedor</label>
                                            <select
                                                className="input-field"
                                                required
                                                value={formData.tercero_id}
                                                onChange={e => {
                                                    setFormData({ ...formData, tercero_id: e.target.value });
                                                    fetchPendingOrders(e.target.value);
                                                }}
                                            >
                                                <option value="">Seleccionar Proveedor...</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Orden de Compra (Opcional)</label>
                                            <select
                                                className="input-field"
                                                value={formData.orden_id}
                                                onChange={e => handleSelectOrder(e.target.value)}
                                                disabled={!formData.tercero_id}
                                            >
                                                <option value="">Entrada Directa (Sin Orden)</option>
                                                {pendingOrders.map(o => (
                                                    <option key={o.id} value={o.id}>
                                                        Orden #{o.id} - {new Date(o.fecha).toLocaleDateString()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Bodega de Ingreso</label>
                                            <select
                                                className="input-field"
                                                required
                                                value={formData.warehouse_id}
                                                onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })}
                                            >
                                                <option value="">Seleccionar Bodega...</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Número de Remisión</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.num_remision}
                                                onChange={e => setFormData({ ...formData, num_remision: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>

                                    <div className="glass" style={{ marginTop: '1.5rem', padding: '1rem' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>Productos a Ingresar</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '1rem', alignItems: 'end' }}>
                                            <div className="input-group">
                                                <label className="input-label">Producto</label>
                                                <select
                                                    className="input-field"
                                                    value={newItem.product_id}
                                                    onChange={e => setNewItem({ ...newItem, product_id: e.target.value })}
                                                >
                                                    <option value="">Seleccionar Producto...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
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
                                            <button type="button" className="btn btn-primary" onClick={handleAddItem} style={{ height: '42px' }}>Agregar</button>
                                        </div>

                                        <table className="data-table" style={{ marginTop: '1rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Cantidad</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.nombre}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="input-field"
                                                                style={{ width: '80px', padding: '0.25rem' }}
                                                                value={item.cantidad}
                                                                onChange={e => {
                                                                    const updated = [...formData.items];
                                                                    updated[idx].cantidad = parseFloat(e.target.value);
                                                                    setFormData({ ...formData, items: updated });
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <button onClick={() => {
                                                                const updated = formData.items.filter((_, i) => i !== idx);
                                                                setFormData({ ...formData, items: updated });
                                                            }} className="btn-action delete"><XCircle size={14} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">
                                        {isEditing ? 'Guardar Cambios' : 'Registrar Entrada'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Detalle */}
            <AnimatePresence>
                {showDetailModal && selectedEntry && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h3 className="font-heading">Detalle de Entrada #{selectedEntry.id}</h3>
                                <button onClick={() => setShowDetailModal(false)} className="btn-action"><XCircle size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><strong>Proveedor:</strong> {selectedEntry.tercero_nombre}</div>
                                    <div><strong>Bodega:</strong> {selectedEntry.warehouse_name}</div>
                                    <div><strong>Remisión:</strong> {selectedEntry.num_remision || 'N/A'}</div>
                                    <div><strong>Fecha:</strong> {new Date(selectedEntry.fecha).toLocaleString()}</div>
                                    {selectedEntry.orden_id && <div><strong>Orden Origen:</strong> #{selectedEntry.orden_id}</div>}
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad Ingresada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedEntry.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.product_name}</td>
                                                <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{parseFloat(item.cantidad)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setShowDetailModal(false)} className="btn btn-primary">Cerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WarehouseEntries;
