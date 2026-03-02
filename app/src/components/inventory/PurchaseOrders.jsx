import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, CheckCircle, XCircle, Eye, ShoppingCart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { infoAlert, errorAlert, confirmDialog } from '../../utils/swal';

const PurchaseOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [formData, setFormData] = useState({
        tercero_id: '',
        sede_id: 1, // Default for now
        total: 0,
        observaciones: '',
        items: []
    });

    const [newItem, setNewItem] = useState({
        product_id: '',
        cantidad_pedida: 1,
        precio_unitario: 0,
        nombre: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const API_URL = 'http://localhost/newpos/api/public/compras/ordenes';
    const API_TERCEROS = 'http://localhost/newpos/api/public/terceros';
    const API_PRODUCTS = 'http://localhost/newpos/api/public/inventory/products';

    useEffect(() => {
        fetchOrders();
        fetchSuppliers();
        fetchProducts();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setOrders(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
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

    const fetchProducts = async () => {
        const token = localStorage.getItem('pos_token');
        const res = await fetch(API_PRODUCTS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setProducts(data);
    };

    const handleAddItem = () => {
        if (!newItem.product_id || newItem.cantidad_pedida <= 0) return;

        const product = products.find(p => p.id == newItem.product_id);
        const itemWithData = {
            ...newItem,
            product_id: parseInt(newItem.product_id),
            nombre: product ? product.nombre : '',
            subtotal: newItem.cantidad_pedida * newItem.precio_unitario
        };

        const updatedItems = [...formData.items, itemWithData];
        const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

        setFormData({ ...formData, items: updatedItems, total: newTotal });
        setNewItem({ product_id: '', cantidad_pedida: 1, precio_unitario: 0, nombre: '' });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
        setFormData({ ...formData, items: updatedItems, total: newTotal });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            infoAlert('Debes agregar al menos un producto', 'Sin productos');
            return;
        }

        try {
            const token = localStorage.getItem('pos_token');
            const url = isEditing ? `${API_URL}/${editId}` : API_URL;
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
                setFormData({ tercero_id: '', sede_id: 1, total: 0, observaciones: '', items: [] });
                fetchOrders();
            } else {
                const err = await res.json();
                errorAlert(err.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving order:', error);
        }
    };

    const handleDeleteOrder = async (id) => {
        if (!(await confirmDialog('¿Estás seguro de eliminar esta orden?', '¿Eliminar orden?', 'Sí, eliminar'))) return;
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchOrders();
            } else {
                const err = await res.json();
                errorAlert(err.error || 'No se pudo eliminar');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const handleEditOrder = async (order) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/${order.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const fullOrder = await res.json();
            setFormData({
                tercero_id: fullOrder.tercero_id,
                sede_id: fullOrder.sede_id,
                total: fullOrder.total,
                observaciones: fullOrder.observaciones,
                items: fullOrder.items.map(i => ({
                    product_id: i.product_id,
                    cantidad_pedida: parseFloat(i.cantidad_pedida),
                    cantidad_recibida: parseFloat(i.cantidad_recibida),
                    precio_unitario: parseFloat(i.precio_unitario),
                    nombre: i.product_name,
                    subtotal: i.cantidad_pedida * i.precio_unitario
                }))
            });
            setIsEditing(true);
            setEditId(order.id);
            setShowModal(true);
        } catch (error) {
            console.error('Error loading order for edit:', error);
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSelectedOrder(data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'PENDIENTE': { bg: '#FEF3C7', color: '#92400E' },
            'PARCIAL': { bg: '#DBEAFE', color: '#1E40AF' },
            'COMPLETADA': { bg: '#D1FAE5', color: '#065F46' },
            'ANULADA': { bg: '#FEE2E2', color: '#991B1B' }
        };
        const style = styles[status] || styles['PENDIENTE'];
        return (
            <span className="badge" style={{ background: style.bg, color: style.color }}>
                {status}
            </span>
        );
    };

    return (
        <div className="component-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h2 className="font-heading">Órdenes de Compra</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Gestiona tus requerimientos y solicitudes a proveedores</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setFormData({ tercero_id: '', sede_id: 1, total: 0, observaciones: '', items: [] });
                    setIsEditing(false);
                    setEditId(null);
                    setShowModal(true);
                }}>
                    <Plus size={18} /> Nueva Orden
                </button>
            </div>

            <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por proveedor u observaciones..."
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
                            <th>Estado</th>
                            <th>Total</th>
                            <th>Usuario</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron órdenes</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td>{new Date(order.fecha).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>{order.tercero_nombre}</td>
                                    <td>{getStatusBadge(order.estado)}</td>
                                    <td style={{ fontWeight: 600 }}>${parseFloat(order.total).toLocaleString()}</td>
                                    <td>{order.user_name}</td>
                                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button className="btn-action edit" title="Ver Detalle" onClick={() => handleViewDetail(order.id)}><Eye size={16} /></button>
                                        {(order.estado === 'PENDIENTE' || order.estado === 'PARCIAL') && (
                                            <button className="btn-action edit" title="Editar" onClick={() => handleEditOrder(order)} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><FileText size={16} /></button>
                                        )}
                                        {order.estado === 'PENDIENTE' && (
                                            <button className="btn-action delete" title="Eliminar" onClick={() => handleDeleteOrder(order.id)}><XCircle size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Nueva Orden */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '1000px' }}>
                            <div className="modal-header">
                                <h3 className="font-heading">{isEditing ? `Editar Orden de Compra #${editId}` : 'Nueva Orden de Compra'}</h3>
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
                                                onChange={e => setFormData({ ...formData, tercero_id: e.target.value })}
                                            >
                                                <option value="">Seleccionar Proveedor...</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Observaciones</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.observaciones}
                                                onChange={e => setFormData({ ...formData, observaciones: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>

                                    <div className="glass" style={{ marginTop: '1.5rem', padding: '1rem' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>Agregar Productos</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 150px auto', gap: '1rem', alignItems: 'end' }}>
                                            <div className="input-group">
                                                <label className="input-label">Producto</label>
                                                <select
                                                    className="input-field"
                                                    value={newItem.product_id}
                                                    onChange={e => setNewItem({ ...newItem, product_id: e.target.value })}
                                                >
                                                    <option value="">Seleccionar Producto...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>)}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Cant. Pedida</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={newItem.cantidad_pedida}
                                                    onChange={e => setNewItem({ ...newItem, cantidad_pedida: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Precio Unit. (Costo)</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={newItem.precio_unitario}
                                                    onChange={e => setNewItem({ ...newItem, precio_unitario: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <button type="button" className="btn btn-primary" onClick={handleAddItem} style={{ height: '42px' }}>Agregar</button>
                                        </div>

                                        <table className="data-table" style={{ marginTop: '1rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Cant.</th>
                                                    <th>Precio</th>
                                                    <th>Subtotal</th>
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
                                                                value={item.cantidad_pedida}
                                                                onChange={e => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    const min = item.cantidad_recibida || 0;
                                                                    if (isEditing && val < min) {
                                                                        infoAlert(`No se puede reducir la cantidad por debajo de lo ya recibido (${min})`, 'Cantidad mínima');
                                                                        return;
                                                                    }
                                                                    const updated = [...formData.items];
                                                                    updated[idx].cantidad_pedida = val;
                                                                    updated[idx].subtotal = updated[idx].cantidad_pedida * updated[idx].precio_unitario;
                                                                    const newTotal = updated.reduce((sum, i) => sum + i.subtotal, 0);
                                                                    setFormData({ ...formData, items: updated, total: newTotal });
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="input-field"
                                                                style={{ width: '100px', padding: '0.25rem' }}
                                                                value={item.precio_unitario}
                                                                onChange={e => {
                                                                    const updated = [...formData.items];
                                                                    updated[idx].precio_unitario = parseFloat(e.target.value);
                                                                    updated[idx].subtotal = updated[idx].cantidad_pedida * updated[idx].precio_unitario;
                                                                    const newTotal = updated.reduce((sum, i) => sum + i.subtotal, 0);
                                                                    setFormData({ ...formData, items: updated, total: newTotal });
                                                                }}
                                                            />
                                                        </td>
                                                        <td>${item.subtotal.toLocaleString()}</td>
                                                        <td>
                                                            {(isEditing && (item.cantidad_recibida || 0) > 0) ? (
                                                                <span title="No se puede eliminar un ítem con recepciones" style={{ color: '#999' }}>--</span>
                                                            ) : (
                                                                <button type="button" onClick={() => handleRemoveItem(idx)} className="btn-action delete"><XCircle size={14} /></button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {formData.items.length > 0 && (
                                                    <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ddd' }}>
                                                        <td colSpan="3" style={{ textAlign: 'right' }}>TOTAL ORDEN:</td>
                                                        <td>${formData.total.toLocaleString()}</td>
                                                        <td></td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">
                                        {isEditing ? 'Guardar Cambios' : 'Crear Orden de Compra'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Detalle */}
            <AnimatePresence>
                {showDetailModal && selectedOrder && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '700px' }}>
                            <div className="modal-header">
                                <h3 className="font-heading">Detalle de Orden #{selectedOrder.id}</h3>
                                <button onClick={() => setShowDetailModal(false)} className="btn-action"><XCircle size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div><strong>Proveedor:</strong> {selectedOrder.tercero_nombre}</div>
                                    <div><strong>Estado:</strong> {getStatusBadge(selectedOrder.estado)}</div>
                                    <div><strong>Fecha:</strong> {new Date(selectedOrder.fecha).toLocaleString()}</div>
                                    <div><strong>User:</strong> {selectedOrder.user_name}</div>
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Pedida</th>
                                            <th>Recibida</th>
                                            <th>Precio</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.product_name}</td>
                                                <td>{parseFloat(item.cantidad_pedida)}</td>
                                                <td style={{ color: item.cantidad_recibida >= item.cantidad_pedida ? 'green' : 'orange', fontWeight: 'bold' }}>
                                                    {parseFloat(item.cantidad_recibida)}
                                                </td>
                                                <td>${parseFloat(item.precio_unitario).toLocaleString()}</td>
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

export default PurchaseOrders;
