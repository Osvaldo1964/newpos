import React, { useState, useEffect } from 'react';
import { Calendar, Search, MapPin, TrendingUp, DollarSign, ShoppingCart, Printer } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatCurrency } from '../../utils/formatters';
import StoreHeader from './StoreHeader';

ChartJS.register(ArcElement, Tooltip, Legend);

const API = 'http://localhost/newpos/api/public';
const PALETTE = ['#1E3A8A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function SalesBySede() {
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
            const res = await fetch(`${API}/reports/sales-by-sede?from=${from}&to=${to}`, {
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

    const chartData = {
        labels: rows.map(r => r.sede),
        datasets: [{
            data: rows.map(r => parseFloat(r.total)),
            backgroundColor: PALETTE.slice(0, rows.length),
            borderWidth: 2,
            borderColor: '#fff',
        }]
    };

    return (
        <div className="component-fade-in">
            <StoreHeader />
            {/* Header */}
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h2 className="font-heading">Ventas por Sede</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Comparativo de ventas entre sedes en el período</p>
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
                    <button className="btn btn-ghost" onClick={() => window.print()} title="Imprimir">
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* KPIs globales */}
            {totals && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Global', value: formatCurrency(totals.total), icon: <DollarSign size={18} />, color: '#1E3A8A' },
                        { label: 'Facturas', value: totals.num_ventas, icon: <ShoppingCart size={18} />, color: '#10B981' },
                        { label: 'Sedes Activas', value: rows.length, icon: <MapPin size={18} />, color: '#8B5CF6' },
                        { label: 'Promedio/Sede', value: rows.length > 0 ? formatCurrency(totals.total / rows.length) : '$0', icon: <TrendingUp size={18} />, color: '#F59E0B' },
                    ].map(kpi => (
                        <div key={kpi.label} className="card" style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${kpi.color}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ padding: '0.4rem', borderRadius: '8px', background: `${kpi.color}15`, color: kpi.color }}>{kpi.icon}</div>
                            <div>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>{kpi.label}</p>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{kpi.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Gráfico + Tabla lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: rows.length > 1 ? '300px 1fr' : '1fr', gap: '1.5rem' }}>
                {/* Doughnut Chart */}
                {rows.length > 1 && (
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Distribución</h4>
                        <div style={{ width: '220px', height: '220px' }}>
                            <Doughnut data={chartData} options={{ plugins: { legend: { display: false } }, cutout: '65%' }} />
                        </div>
                        <div style={{ marginTop: '1rem', width: '100%' }}>
                            {rows.map((r, i) => (
                                <div key={r.sede} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: PALETTE[i], flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.8rem', flex: 1 }}>{r.sede}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: PALETTE[i] }}>{r.porcentaje}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabla */}
                <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
                    <table className="data-table" style={{ margin: 0, fontSize: '0.75rem', width: '100%', minWidth: '600px' }}>
                        <thead>
                            <tr>
                                <th>Sede</th>
                                <th style={{ textAlign: 'center' }}>Facturas</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                                <th style={{ textAlign: 'right' }}>IVA</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th style={{ textAlign: 'center' }}>% Participación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Cargando...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Sin ventas en el período</td></tr>
                            ) : (
                                rows.map((row, i) => (
                                    <tr key={row.sede}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: PALETTE[i] }} />
                                                <span style={{ fontWeight: 600 }}>{row.sede}</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}><span className="badge badge-blue">{row.num_ventas}</span></td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.subtotal)}</td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(row.iva)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(row.total)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                                                    <div style={{ width: `${row.porcentaje}% `, height: '100%', background: PALETTE[i], borderRadius: 4 }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '36px' }}>{row.porcentaje}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {totals && rows.length > 0 && (
                            <tfoot>
                                <tr style={{ fontWeight: 700, background: 'var(--primary)', color: 'white', fontSize: '0.75rem' }}>
                                    <td>TOTAL</td>
                                    <td style={{ textAlign: 'center' }}>{totals.num_ventas}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totals.subtotal)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totals.iva)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totals.total)}</td>
                                    <td style={{ textAlign: 'center' }}>100%</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
