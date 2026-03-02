import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ShoppingBag, Search, Eye, Filter, CheckCircle, Clock, XCircle, Truck, MapPin, User, FileText, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import * as swal from '../../utils/swal';

const API = 'http://localhost/newpos/api/public';

const statusConfig = {
    'PENDIENTE': { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7', icon: <Clock size={16} /> },
    'PAGADO': { label: 'Pagado', color: '#10B981', bg: '#DCFCE7', icon: <CheckCircle size={16} /> },
    'DESPACHADO': { label: 'Despachado', color: '#3B82F6', bg: '#DBEAFE', icon: <Truck size={16} /> },
    'COMPLETADO': { label: 'Completado', color: '#6366F1', bg: '#E0E7FF', icon: <CheckCircle size={16} /> },
    'CANCELADO': { label: 'Cancelado', color: '#EF4444', bg: '#FEE2E2', icon: <XCircle size={16} /> }
};

export default function OnlineOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('pos_token');
            const url = statusFilter ? `${API}/online-orders?status=${statusFilter}` : `${API}/online-orders`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            swal.errorAlert('Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = async (id) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API}/online-orders/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedOrder(data);
                setIsModalOpen(true);
            }
        } catch (error) {
            swal.errorAlert('Error al cargar detalle del pedido');
        }
    };

    const handleUpdateStatus = async (newStatus, checkPayment = false) => {
        let paymentMethodToUpdate = selectedOrder.metodo_pago;

        if (checkPayment) {
            const confirmed = await swal.confirmDialog(
                '¿Has recibido el pago por este pedido?',
                'Confirmar Pago',
                'Sí, pago recibido'
            );
            if (!confirmed) return;
        }

        setUpdating(true);
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API}/online-orders/${selectedOrder.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    estado: newStatus,
                    metodo_pago: paymentMethodToUpdate
                })
            });

            if (res.ok) {
                swal.toast('Estado actualizado', 'success');
                setIsModalOpen(false); // Close modal on success
                fetchOrders(); // Refresh table
            } else {
                throw new Error();
            }
        } catch (error) {
            swal.errorAlert('Error al actualizar estado');
        } finally {
            setUpdating(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(searchTerm) ||
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customer_documento && o.customer_documento.includes(searchTerm))
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingBag size={28} style={{ color: 'var(--primary)' }} /> Pedidos Online
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Gestiona los pedidos de la tienda virtual E-commerce</p>
                </div>
                <button onClick={fetchOrders} className="btn btn-ghost" title="Actualizar">
                    <Clock size={16} /> Refrescar
                </button>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por ID, Cliente o Doc..."
                            className="input-field"
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                        <button className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter('')}>Todos</button>
                        <button className={`btn ${statusFilter === 'PENDIENTE' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter('PENDIENTE')}>Pendientes</button>
                        <button className={`btn ${statusFilter === 'PAGADO' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter('PAGADO')}>Pagados / Empacar</button>
                        <button className={`btn ${statusFilter === 'DESPACHADO' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter('DESPACHADO')}>Despachados</button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>N° Pedido</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Método Pago</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Cargando pedidos...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay pedidos encontrados.</td></tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const conf = statusConfig[order.estado] || statusConfig['PENDIENTE'];
                                    return (
                                        <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => handleViewOrder(order.id)} className="hover-row">
                                            <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{order.id.toString().padStart(5, '0')}</td>
                                            <td>{new Date(order.created_at).toLocaleString()}</td>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>{order.customer_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customer_documento}</div>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: '#F1F5F9', color: '#475569' }}>
                                                    {order.metodo_pago}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 'bold' }}>{formatCurrency(order.total)}</td>
                                            <td>
                                                <span className="badge" style={{ background: conf.bg, color: conf.color, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    {conf.icon} {conf.label}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalle - Usando Portal para evitar recortes de scroll */}
            {isModalOpen && selectedOrder && ReactDOM.createPortal(
                <AnimatePresence mode="wait">
                    <div className="modal-overlay" style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '60px',
                        paddingBottom: '40px',
                        paddingLeft: '20px',
                        paddingRight: '20px',
                        overflowY: 'auto',
                        zIndex: 9999
                    }} onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, y: -40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -40, scale: 0.95 }}
                            className="modal-content"
                            style={{
                                maxWidth: '850px',
                                width: '100%',
                                maxHeight: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '1.5rem',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'white',
                                marginBottom: '2rem'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header" style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div style={{ flex: 1 }}>
                                        {(() => {
                                            const currentStatus = selectedOrder.estado?.toUpperCase() || 'PENDIENTE';
                                            const c = statusConfig[currentStatus] || statusConfig['PENDIENTE'];
                                            return (
                                                <h3 className="font-heading" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', margin: 0 }}>
                                                    Pedido #{selectedOrder.id.toString().padStart(5, '0')}
                                                    <span className="badge" style={{ background: c.bg, color: c.color, fontSize: '0.8rem', padding: '0.2rem 0.60rem', borderRadius: '999px', fontWeight: 'bold' }}>{c.label}</span>
                                                </h3>
                                            );
                                        })()}
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                            Recibido: {new Date(selectedOrder.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        style={{
                                            background: '#F8FAFC',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#64748B',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#FFFFFF';
                                            e.currentTarget.style.color = '#EF4444';
                                            e.currentTarget.style.borderColor = '#FEE2E2';
                                            e.currentTarget.style.transform = 'rotate(90deg)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#F8FAFC';
                                            e.currentTarget.style.color = '#64748B';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.transform = 'rotate(0deg)';
                                        }}
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="modal-body" style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto', background: '#F8FAFC' }}>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                                    {/* Datos Cliente */}
                                    <div className="card" style={{ padding: '1.5rem' }}>
                                        <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={18} /> Datos del Cliente
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                                            <div><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '90px' }}>Nombre:</span> <strong>{selectedOrder.customer_name}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '90px' }}>Doc:</span> {selectedOrder.customer_documento}</div>
                                            <div><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '90px' }}>Email:</span> {selectedOrder.customer_email}</div>
                                            <div><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '90px' }}>Teléfono:</span> <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {selectedOrder.customer_phone}</span></div>
                                        </div>
                                    </div>

                                    {/* Datos Envío */}
                                    <div className="card" style={{ padding: '1.5rem' }}>
                                        <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={18} /> Datos de Envío y Pago
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                                            <div style={{ background: '#F1F5F9', padding: '0.75rem', borderRadius: '8px' }}>
                                                <strong>Dirección de entrega:</strong><br />
                                                {selectedOrder.customer_address || 'No especificada'}
                                            </div>
                                            <div><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '90px' }}>Método:</span> <strong>{selectedOrder.metodo_pago}</strong></div>
                                            {selectedOrder.referencia_pago && (
                                                <div><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '90px' }}>Referencia:</span> <code style={{ background: '#F1F5F9', padding: '2px 4px' }}>{selectedOrder.referencia_pago}</code></div>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Items del Pedido */}
                                <div className="card" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={18} /> Productos
                                    </h4>

                                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <tr>
                                                    <th style={{ padding: '0.75rem 1rem' }}>Item</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Cant.</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>V. Unit</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items && selectedOrder.items.map((item, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
                                                        <td style={{ padding: '1rem' }}>
                                                            <strong>{item.nombre_producto}</strong>
                                                            {item.sku && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>}
                                                        </td>
                                                        <td style={{ padding: '1rem', textAlign: 'center' }}>{parseInt(item.cantidad)}</td>
                                                        <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(item.precio_unitario)}</td>
                                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.precio_unitario * parseInt(item.cantidad))}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot style={{ background: '#F8FAFC' }}>
                                                <tr>
                                                    <td colSpan="3" style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Total del Pedido</td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>
                                                        {formatCurrency(selectedOrder.total)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {selectedOrder.notas && (
                                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#FEF9C3', borderRadius: '8px', borderLeft: '4px solid #EAB308', fontSize: '0.95rem' }}>
                                            <strong>Notas del cliente:</strong><br />
                                            {selectedOrder.notas}
                                        </div>
                                    )}
                                </div>

                                {/* Acciones de Gestión */}
                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                                    {(() => {
                                        const currentStatus = selectedOrder.estado?.toUpperCase() || 'PENDIENTE';

                                        if (currentStatus === 'PENDIENTE') {
                                            return (
                                                <>
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleUpdateStatus('DESPACHADO')}
                                                        disabled={updating}
                                                        style={{ background: '#3B82F6', borderColor: '#3B82F6' }}
                                                    >
                                                        <Truck size={18} /> Despachar ahora
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        onClick={() => handleUpdateStatus('PAGADO', true)}
                                                        disabled={updating}
                                                        style={{ background: '#10B981', color: 'white', borderColor: '#10B981' }}
                                                    >
                                                        <CheckCircle size={18} /> Marcar como Pagado
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        onClick={() => handleUpdateStatus('CANCELADO')}
                                                        disabled={updating}
                                                        style={{
                                                            background: '#FEF2F2',
                                                            color: '#EF4444',
                                                            border: '1px solid #FEE2E2',
                                                        }}
                                                    >
                                                        <XCircle size={18} /> Cancelar Pedido
                                                    </button>
                                                </>
                                            );
                                        }

                                        if (currentStatus === 'PAGADO') {
                                            return (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleUpdateStatus('DESPACHADO')}
                                                    disabled={updating}
                                                    style={{ background: '#3B82F6', borderColor: '#3B82F6' }}
                                                >
                                                    <Truck size={18} /> Marcar como Despachado
                                                </button>
                                            );
                                        }

                                        if (currentStatus === 'DESPACHADO') {
                                            return (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleUpdateStatus('COMPLETADO')}
                                                    disabled={updating}
                                                    style={{ background: '#6366F1', borderColor: '#6366F1' }}
                                                >
                                                    <CheckCircle size={18} /> Finalizar (Entregado)
                                                </button>
                                            );
                                        }

                                        return null;
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
