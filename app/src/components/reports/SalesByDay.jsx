import React, { useState, useEffect } from 'react';
import { Calendar, Search, TrendingUp, DollarSign, ShoppingCart, Printer, Banknote, CreditCard, ArrowUpDown, Smartphone } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import StoreHeader from './StoreHeader';

const API = 'http://localhost/newpos/api/public';

export default function SalesByDay() {
    const today = new Date().toISOString().slice(0, 10);
    const firstDay = today.slice(0, 8) + '01';

    const [from, setFrom] = useState(firstDay);
    const [to, setTo] = useState(today);
    const [rows, setRows] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API}/reports/sales-by-day?from=${from}&to=${to}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setRows(data.rows || []);
            setTotals(data.totals || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePrint = () => window.print();

    const paymentMethods = ['efectivo', 'tarjeta', 'transferencia', 'nequi'];
    const methodLabels = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', nequi: 'Nequi' };
    const methodColors = { efectivo: '#10B981', tarjeta: '#3B82F6', transferencia: '#8B5CF6', nequi: '#F59E0B' };

    return (
        <div className="component-fade-in">
            <StoreHeader />
            {/* Header + Filtros */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 className="font-heading">Ventas por Día</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Resumen diario de ventas e ingresos por método de pago</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.875rem', fontFamily: 'inherit' }} />
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.875rem', fontFamily: 'inherit' }} />
                    </div>
                    <button className="btn btn-primary" onClick={fetchData} disabled={loading}>
                        <Search size={16} /> {loading ? 'Cargando...' : 'Consultar'}
                    </button>
                    <button className="btn btn-ghost" onClick={handlePrint} title="Imprimir">
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* KPIs */}
            {totals && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Ventas', value: formatCurrency(totals.total), icon: <DollarSign size={18} />, color: '#1E3A8A' },
                        { label: 'N° Facturas', value: totals.num_ventas, icon: <ShoppingCart size={18} />, color: '#10B981' },
                        { label: 'Promedio/Día', value: rows.length > 0 ? formatCurrency(totals.total / rows.length) : '$0.00', icon: <TrendingUp size={18} />, color: '#8B5CF6' },
                        { label: 'Efectivo', value: formatCurrency(totals.efectivo), icon: <Banknote size={18} />, color: '#10B981' },
                        { label: 'Tarjeta', value: formatCurrency(totals.tarjeta), icon: <CreditCard size={18} />, color: '#3B82F6' },
                        { label: 'Transferencia', value: formatCurrency(totals.transferencia), icon: <ArrowUpDown size={18} />, color: '#8B5CF6' },
                    ].map(kpi => (
                        <div key={kpi.label} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${kpi.color}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', borderRadius: '10px', background: `${kpi.color}15`, color: kpi.color }}>{kpi.icon}</div>
                            <div>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</p>
                                <p style={{ fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{kpi.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabla */}
            <div className="table-container">
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th style={{ textAlign: 'center' }}>Facturas</th>
                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                            <th style={{ textAlign: 'right' }}>IVA</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            {paymentMethods.map(m => (
                                <th key={m} style={{ textAlign: 'right', color: methodColors[m] }}>{methodLabels[m]}</th>
                            ))}
                            <th>Cajeros</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="10" style={{ textAlign: 'center', padding: '3rem' }}>Cargando...</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Sin ventas en el período seleccionado</td></tr>
                        ) : (
                            rows.map(row => (
                                <tr key={row.fecha}>
                                    <td style={{ fontWeight: 600 }}>
                                        {new Date(row.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="badge badge-blue">{row.num_ventas}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(row.subtotal)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatCurrency(row.iva)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{formatCurrency(row.total)}</td>
                                    {paymentMethods.map(m => (
                                        <td key={m} style={{ textAlign: 'right', whiteSpace: 'nowrap', color: parseFloat(row[m]) > 0 ? methodColors[m] : 'var(--text-muted)' }}>
                                            {parseFloat(row[m]) > 0 ? formatCurrency(row[m]) : '—'}
                                        </td>
                                    ))}
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.cajeros}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {totals && rows.length > 0 && (
                        <tfoot>
                            <tr style={{ fontWeight: 700, background: '#2563EB', color: 'white', fontSize: '0.82rem' }}>
                                <td>TOTAL PERÍODO</td>
                                <td style={{ textAlign: 'center' }}>{totals.num_ventas}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(totals.subtotal)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(totals.iva)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(totals.total)}</td>
                                {paymentMethods.map(m => (
                                    <td key={m} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(totals[m])}</td>
                                ))}
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
