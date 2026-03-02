import React, { useState, useEffect, useRef } from 'react';
import {
    Search, ShoppingCart, User, Package, Warehouse,
    Trash2, Plus, Minus, CreditCard, Banknote,
    ArrowRightLeft, X, CheckCircle, Calculator, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import SaleTicket from './SaleTicket';
import { infoAlert, errorAlert } from '../../utils/swal';

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
    const [showTicket, setShowTicket] = useState(false);
    const [ticketData, setTicketData] = useState(null);
    const [activePromos, setActivePromos] = useState([]);   // promotions from API
    const [globalPromo, setGlobalPromo] = useState(null); // manually chosen global promo

    const API_URL = 'http://localhost/newpos/api/public';
    const inputSearchRef = useRef(null);

    useEffect(() => {
        fetchInitialData();
        inputSearchRef.current?.focus();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const [wrRes, custRes, promoRes] = await Promise.all([
                fetch(`${API_URL}/inventory/warehouses`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/terceros`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/promotions/active`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const wrData = await wrRes.json();
            const custData = await custRes.json();
            const promoData = promoRes.ok ? await promoRes.json() : [];

            setWarehouses(wrData);
            setCustomers(custData);
            setActivePromos(Array.isArray(promoData) ? promoData : []);

            if (wrData.length > 0) setSelectedWarehouse(wrData[0].id);

            const defaultCust = custData.find(c => c.nombre.toLowerCase().includes('general')) || custData[0];
            setSelectedCustomer(defaultCust);
        } catch (error) {
            console.error('Error fetching POS data:', error);
        }
    };

    /**
     * Resolve best promotion for a cart item.
     * Priority: product-specific > category > global
     * Returns { promo, descuento } or null.
     */
    const resolvePromo = (product) => {
        // 1. Product-specific
        const byProduct = activePromos.find(p =>
            p.product_ids && p.product_ids.includes(product.id)
        );
        if (byProduct) return byProduct;

        // 2. Category
        const byCategory = activePromos.find(p =>
            p.category_ids && p.category_ids.includes(product.category_id)
        );
        if (byCategory) return byCategory;

        // 3. Global (no targets)
        return null; // global promos are applied manually via globalPromo selector
    };

    const calcDiscount = (promo, subtotal) => {
        if (!promo) return 0;
        if (promo.tipo === 'PORCENTAJE') return Math.round(subtotal * parseFloat(promo.valor) / 100 * 100) / 100;
        return Math.min(parseFloat(promo.valor), subtotal); // FIJO, capped at subtotal
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
            setCart(cart.map(item => {
                if (item.product_id !== product.id) return item;
                const qty = item.cantidad + 1;
                const subRaw = qty * item.precio_unitario;
                const desc = calcDiscount(item.promo, subRaw);
                return { ...item, cantidad: qty, subtotal: subRaw - desc, descuento: desc };
            }));
        } else {
            const precio = parseFloat(product.precio_base);
            const promo = resolvePromo(product);
            const desc = calcDiscount(promo, precio);
            setCart([...cart, {
                product_id: product.id,
                category_id: product.category_id,
                nombre: product.nombre,
                sku: product.sku,
                precio_unitario: precio,
                cantidad: 1,
                iva: parseFloat(product.iva || 0),
                subtotal: precio - desc,
                descuento: desc,
                promocion_id: promo ? promo.id : null,
                promo: promo
            }]);
        }
        setSearchTerm('');
        setProducts([]);
        inputSearchRef.current?.focus();
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.product_id !== productId) return item;
            const qty = Math.max(1, item.cantidad + delta);
            const subRaw = qty * item.precio_unitario;
            const desc = calcDiscount(item.promo, subRaw);
            return { ...item, cantidad: qty, subtotal: subRaw - desc, descuento: desc };
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const totalDescItems = cart.reduce((acc, item) => acc + (item.descuento || 0), 0);
    const ivaTotal = cart.reduce((acc, item) => acc + (item.subtotal * (item.iva / 100)), 0);

    // Global promo discount applies over (subtotal - already-discounted items)
    const globalDiscount = globalPromo ? calcDiscount(globalPromo, subtotal) : 0;
    const total = subtotal - globalDiscount + ivaTotal;

    const handleFinishSale = async () => {
        if (cart.length === 0) return;
        setPayments([{ metodo: 'EFECTIVO', monto: total, referencia: '' }]);
        setShowPaymentModal(true);
    };

    const processSale = async () => {
        // Separar pagos en efectivo y otros medios
        const nonCashTotal = payments
            .filter(p => p.metodo !== 'EFECTIVO')
            .reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);

        const cashTotal = payments
            .filter(p => p.metodo === 'EFECTIVO')
            .reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);

        const hasCash = payments.some(p => p.metodo === 'EFECTIVO');
        const totalCovered = nonCashTotal + cashTotal;

        if (hasCash) {
            // Con efectivo: el total recibido debe cubrir la venta (puede haber vuelto)
            if (totalCovered < total - 0.01) {
                infoAlert('El efectivo recibido es insuficiente para cubrir el total de la venta', 'Pago insuficiente');
                return;
            }
        } else {
            // Sin efectivo: los medios electrónicos deben coincidir exactamente
            if (Math.abs(totalCovered - total) > 0.01) {
                infoAlert('El total pagado debe coincidir exactamente con el total de la venta', 'Monto incorrecto');
                return;
            }
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
                descuento_total: totalDescItems + globalDiscount,
                iva_total: ivaTotal,
                total: total,
                global_promo_id: globalPromo?.id || null,
                items: cart.map(item => ({
                    ...item,
                    descuento: item.descuento || 0,
                    promocion_id: item.promocion_id || null
                })),
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
                const result = await res.json();
                const now = new Date();
                const user = JSON.parse(localStorage.getItem('pos_user'));
                const warehouse = warehouses.find(w => w.id == selectedWarehouse);

                // Calcular cambio: solo si hay un pago en efectivo que supere el total
                const efectivoPago = payments.find(p => p.metodo === 'EFECTIVO');
                const cambio = efectivoPago && parseFloat(efectivoPago.monto) > total
                    ? parseFloat(efectivoPago.monto) - total
                    : 0;

                setTicketData({
                    saleId: result.sale_id,
                    fecha: now.toLocaleString('es-CO', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    }),
                    cajero: user.nombre,
                    customer: selectedCustomer?.nombre || 'Público General',
                    warehouse: warehouse?.nombre || '',
                    items: cart,
                    subtotal,
                    descuentoTotal: totalDescItems + globalDiscount,
                    globalPromo,
                    ivaTotal,
                    total,
                    payments,
                    cambio
                });

                // Limpiar y mostrar ticket
                setCart([]);
                setShowPaymentModal(false);
                setSearchTerm('');
                setShowTicket(true);
            } else {
                const err = await res.json();
                errorAlert(err.error || 'Error al procesar la venta');
            }
        } catch (error) {
            console.error('Error processing sale:', error);
            errorAlert('Error crítico de red');
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
                                <th style={{ textAlign: 'center' }}>Cant.</th>
                                <th style={{ textAlign: 'right' }}>Precio</th>
                                <th style={{ textAlign: 'right', color: 'var(--emerald)' }}>Desc.</th>
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
                                        {item.promo && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <Tag size={10} /> {item.promo.nombre}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button className="btn-action" onClick={() => updateQuantity(item.product_id, -1)}><Minus size={14} /></button>
                                            <span style={{ minWidth: '30px', fontWeight: 600 }}>{item.cantidad}</span>
                                            <button className="btn-action" onClick={() => updateQuantity(item.product_id, 1)}><Plus size={14} /></button>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.precio_unitario)}</td>
                                    <td style={{ textAlign: 'right', color: item.descuento > 0 ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: item.descuento > 0 ? 700 : 400 }}>
                                        {item.descuento > 0 ? `-${formatCurrency(item.descuento)}` : '—'}
                                    </td>
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

                <div className="card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 className="font-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingCart size={20} /> Resumen de Venta
                    </h3>

                    {/* Promotion Global Selector */}
                    {activePromos.some(p => !p.product_ids?.length && !p.category_ids?.length) && (
                        <div>
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Tag size={14} /> Promoción Global
                            </label>
                            <select className="input-field"
                                value={globalPromo?.id || ''}
                                onChange={e => setGlobalPromo(
                                    e.target.value ? activePromos.find(p => p.id == e.target.value) : null
                                )}
                            >
                                <option value="">Sin promoción adicional</option>
                                {activePromos
                                    .filter(p => !p.product_ids?.length && !p.category_ids?.length)
                                    .map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} ({p.tipo === 'PORCENTAJE' ? `${p.valor}%` : `$${Number(p.valor).toLocaleString('es-CO')}`})
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                        <div className="flex-between">
                            <span style={{ color: 'var(--text-muted)' }}>Subtotal bruto</span>
                            <span>{formatCurrency(cart.reduce((a, i) => a + i.cantidad * i.precio_unitario, 0))}</span>
                        </div>
                        {(totalDescItems + globalDiscount) > 0 && (
                            <div className="flex-between" style={{ color: 'var(--emerald)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Tag size={14} /> Descuentos
                                </span>
                                <span style={{ fontWeight: 700 }}>-{formatCurrency(totalDescItems + globalDiscount)}</span>
                            </div>
                        )}
                        <div className="flex-between">
                            <span style={{ color: 'var(--text-muted)' }}>IVA</span>
                            <span>{formatCurrency(ivaTotal)}</span>
                        </div>
                        <div style={{ borderTop: '2px dashed var(--border-color)', margin: '0.25rem 0' }}></div>
                        <div className="flex-between" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                            <span>TOTAL</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
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
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Monto Recibido</label>
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
                                            {/* Cambio: solo si es efectivo y el monto supera el total */}
                                            {p.metodo === 'EFECTIVO' && parseFloat(p.monto) > total && (
                                                <div style={{
                                                    marginTop: '0.75rem',
                                                    padding: '0.75rem 1rem',
                                                    background: '#DCFCE7',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    border: '1px solid #86EFAC'
                                                }}>
                                                    <span style={{ fontWeight: 700, color: '#166534', fontSize: '1rem' }}>💰 CAMBIO / VUELTAS</span>
                                                    <span style={{ fontWeight: 900, color: '#166534', fontSize: '1.3rem' }}>
                                                        {formatCurrency(parseFloat(p.monto) - total)}
                                                    </span>
                                                </div>
                                            )}
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

            {/* Ticket / Factura */}
            {showTicket && ticketData && (
                <SaleTicket
                    saleData={ticketData}
                    onClose={() => {
                        setShowTicket(false);
                        setTicketData(null);
                        inputSearchRef.current?.focus();
                    }}
                />
            )}

        </div>
    );
};

export default POS;
