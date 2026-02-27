import React, { useState, useEffect, useRef } from 'react';
import {
    Search, ShoppingCart, User, Package, Warehouse,
    Trash2, Plus, Minus, CreditCard, Banknote,
    ArrowRightLeft, X, CheckCircle, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL = 'http://localhost/newpos/api/public';
    const inputSearchRef = useRef(null);

    useEffect(() => {
        fetchInitialData();
        inputSearchRef.current?.focus();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const [wrRes, custRes] = await Promise.all([
                fetch(`${API_URL}/inventory/warehouses`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/terceros`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const wrData = await wrRes.json();
            const custData = await custRes.json();

            setWarehouses(wrData);
            setCustomers(custData);

            if (wrData.length > 0) setSelectedWarehouse(wrData[0].id);

            // Buscar cliente "Público General" o el primero
            const defaultCust = custData.find(c => c.nombre.toLowerCase().includes('general')) || custData[0];
            setSelectedCustomer(defaultCust);
        } catch (error) {
            console.error('Error fetching POS data:', error);
        }
    };

    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setProducts([]);
            return;
        }

        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/inventory/products?search=${term}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error searching products:', error);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.product_id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario }
                    : item
            ));
        } else {
            const precio = parseFloat(product.precio_base);
            setCart([...cart, {
                product_id: product.id,
                nombre: product.nombre,
                sku: product.sku,
                precio_unitario: precio,
                cantidad: 1,
                iva: parseFloat(product.iva || 0),
                subtotal: precio
            }]);
        }
        setSearchTerm('');
        setProducts([]);
        inputSearchRef.current?.focus();
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.product_id === productId) {
                const newQty = Math.max(1, item.cantidad + delta);
                return { ...item, cantidad: newQty, subtotal: newQty * item.precio_unitario };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const ivaTotal = cart.reduce((acc, item) => acc + (item.subtotal * (item.iva / 100)), 0);
    const total = subtotal + ivaTotal;

    const handleFinishSale = async () => {
        if (cart.length === 0) return;
        setPayments([{ metodo: 'EFECTIVO', monto: total, referencia: '' }]);
        setShowPaymentModal(true);
    };

    const processSale = async () => {
        const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
        if (Math.abs(totalPaid - total) > 0.01) {
            alert('El total pagado debe coincidir con el total de la venta');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('pos_token');
            const user = JSON.parse(localStorage.getItem('pos_user'));
            const session = JSON.parse(localStorage.getItem('pos_active_session'));

            const saleData = {
                user_id: user.id,
                customer_id: selectedCustomer?.id,
                sede_id: user.sede_id,
                warehouse_id: selectedWarehouse,
                subtotal: subtotal,
                iva_total: ivaTotal,
                total: total,
                items: cart,
                payments: payments,
                cash_session_id: session?.id
            };

            const res = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(saleData)
            });

            if (res.ok) {
                alert('Venta realizada con éxito');
                setCart([]);
                setShowPaymentModal(false);
                setSearchTerm('');
            } else {
                const err = await res.json();
                alert(err.error || 'Error al procesar la venta');
            }
        } catch (error) {
            console.error('Error processing sale:', error);
            alert('Error crítico de red');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="pos-container"
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 440px',
                gap: '1.5rem',
                height: 'calc(100vh - 160px)',
            }}
        >

            {/* Left Side: Products Search and Selection */}
            <div className="flex-column" style={{ gap: '1.5rem', overflow: 'hidden' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                ref={inputSearchRef}
                                type="text"
                                className="input-field"
                                placeholder="Escribe nombre o escanea SKU..."
                                style={{ paddingLeft: '2.8rem', fontSize: '1.1rem' }}
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && products.length > 0) addToCart(products[0]);
                                }}
                            />
                        </div>
                        <div style={{ width: '200px' }}>
                            <select
                                className="input-field"
                                value={selectedWarehouse}
                                onChange={(e) => setSelectedWarehouse(e.target.value)}
                            >
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Search Results */}
                    <div style={{ minHeight: '100px', maxHeight: '300px', overflowY: 'auto' }}>
                        {products.length > 0 ? (
                            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {products.map(p => (
                                    <motion.div
                                        key={p.id}
                                        whileTap={{ scale: 0.95 }}
                                        className="glass"
                                        style={{ padding: '1rem', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                                        onClick={() => addToCart(p)}
                                    >
                                        <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{p.sku}</p>
                                        <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{p.nombre}</p>
                                        <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(p.precio_base)}</p>
                                    </motion.div>
                                ))}
                            </div>
                        ) : searchTerm.length > 1 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No se encontraron productos</p>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <Package size={40} opacity={0.3} />
                                <p>Busca productos para comenzar la venta</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Table (Visual) */}
                <div className="card table-container" style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th style={{ textAlign: 'center' }}>Cantidad</th>
                                <th style={{ textAlign: 'right' }}>Precio</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map(item => (
                                <tr key={item.product_id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button className="btn-action" onClick={() => updateQuantity(item.product_id, -1)}><Minus size={14} /></button>
                                            <span style={{ minWidth: '30px', fontWeight: 600 }}>{item.cantidad}</span>
                                            <button className="btn-action" onClick={() => updateQuantity(item.product_id, 1)}><Plus size={14} /></button>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.precio_unitario)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.subtotal)}</td>
                                    <td>
                                        <button className="btn-action" style={{ color: '#EF4444' }} onClick={() => removeFromCart(item.product_id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Side: Totals and Customer */}
            <div className="flex-column" style={{ gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 className="font-heading" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} /> Cliente
                    </h3>
                    <select
                        className="input-field"
                        value={selectedCustomer?.id || ''}
                        onChange={(e) => setSelectedCustomer(customers.find(c => c.id == e.target.value))}
                    >
                        {customers.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>

                <div className="card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 className="font-heading" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingCart size={20} /> Resumen de Venta
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        <div className="flex-between">
                            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex-between">
                            <span style={{ color: 'var(--text-muted)' }}>IVA</span>
                            <span>{formatCurrency(ivaTotal)}</span>
                        </div>
                        <div style={{ borderTop: '2px dashed var(--border-color)', margin: '0.5rem 0' }}></div>
                        <div className="flex-between" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                            <span>TOTAL</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', marginTop: '2rem' }}
                        disabled={cart.length === 0}
                        onClick={handleFinishSale}
                    >
                        <Calculator size={22} /> PROCESAR PAGO
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-content" style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h3 className="font-heading">Finalizar Venta</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="btn-action"><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '15px' }}>
                                    <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>TOTAL A PAGAR</p>
                                    <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 900 }}>{formatCurrency(total)}</h2>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {payments.map((p, idx) => (
                                        <div key={idx} className="glass" style={{ padding: '1.2rem', position: 'relative' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Medio de Pago</label>
                                                    <select
                                                        className="input-field"
                                                        value={p.metodo}
                                                        onChange={(e) => {
                                                            const newPays = [...payments];
                                                            newPays[idx].metodo = e.target.value;
                                                            setPayments(newPays);
                                                        }}
                                                    >
                                                        <option value="EFECTIVO">Efectivo</option>
                                                        <option value="TARJETA">Tarjeta Débito/Crédito</option>
                                                        <option value="TRANSFERENCIA">Transferencia / QR</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Monto</label>
                                                    <input
                                                        type="number"
                                                        className="input-field"
                                                        value={p.monto}
                                                        onChange={(e) => {
                                                            const newPays = [...payments];
                                                            newPays[idx].monto = e.target.value;
                                                            setPayments(newPays);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {p.metodo !== 'EFECTIVO' && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Referencia / Voucher</label>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        placeholder="Opcional..."
                                                        value={p.referencia}
                                                        onChange={(e) => {
                                                            const newPays = [...payments];
                                                            newPays[idx].referencia = e.target.value;
                                                            setPayments(newPays);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        className="btn btn-ghost"
                                        style={{ alignSelf: 'center' }}
                                        onClick={() => setPayments([...payments, { metodo: 'EFECTIVO', monto: 0, referencia: '' }])}
                                    >
                                        <Plus size={16} /> Agregar Pago Dividido
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Atrás</button>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={processSale}
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 'FINALIZAR VENTA'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default POS;
