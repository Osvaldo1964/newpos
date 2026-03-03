import React, { useState, useEffect } from 'react';
import { Calendar, Search, Package, Users, TrendingUp, Printer } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    BarElement, Tooltip, Legend
} from 'chart.js';
import { formatCurrency } from '../../utils/formatters';
import StoreHeader from './StoreHeader';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const API = 'http://localhost/newpos/api/public';

export default function AdvancedReports() {
    const today = new Date().toISOString().slice(0, 10);
    const firstDay = today.slice(0, 8) + '01';

    const [tab, setTab] = useState('productos');
    const [from, setFrom] = useState(firstDay);
    const [to, setTo] = useState(today);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('pos_token');
            const headers = { Authorization: `Bearer ${token}` };
            const params = `from=${from}&to=${to}`;
            const [pRes, cRes] = await Promise.all([
                fetch(`${API}/reports/top-products?${params}&limit=15`, { headers }),
                fetch(`${API}/reports/top-customers?${params}&limit=15`, { headers }),
            ]);
            setProducts(await pRes.json());
            setCustomers(await cRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const productChart = {
        labels: products.slice(0, 10).map(p => p.nombre?.substring(0, 20) + (p.nombre?.length > 20 ? '…' : '')),
        datasets: [{
            label: 'Total Ventas',
            data: products.slice(0, 10).map(p => parseFloat(p.total_ventas)),
            backgroundColor: 'rgba(30, 58, 138, 0.8)',
            borderRadius: 6,
        }]
    };

    const customerChart = {
        labels: customers.slice(0, 10).map(c => c.cliente?.substring(0, 20) + (c.cliente?.length > 20 ? '…' : '')),
        datasets: [{
            label: 'Total Comprado',
            data: customers.slice(0, 10).map(c => parseFloat(c.total_comprado)),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 6,
        }]
    };

    const chartOpts = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                ticks: { callback: v => '$' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }
            }
        }
    };

    return (
        <div className="component-fade-in">
            <StoreHeader />
            {/* Headers y Filtros */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 className="font-heading">Análisis Avanzado</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Top productos más vendidos y clientes más frecuentes</p>
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
                        <Search size={16} />{loading ? 'Cargando...' : 'Consultar'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0' }}>
                {[
                    { id: 'productos', label: 'Top Productos', icon: <Package size={16} /> },
                    { id: 'clientes', label: 'Top Clientes', icon: <Users size={16} /> },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.25rem', border: 'none', cursor: 'pointer',
                            background: 'none', fontWeight: tab === t.id ? 700 : 500,
                            color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                            marginBottom: '-2px', fontSize: '0.9rem', fontFamily: 'inherit',
                            transition: 'all 0.2s'
                        }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Contenido Tab: Productos */}
            {tab === 'productos' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Gráfico */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Top 10 Productos
                        </h4>
                        {products.length > 0
                            ? <div style={{ position: 'relative', height: '320px' }}>
                                <Bar data={productChart} options={chartOpts} />
                            </div>
                            : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Sin datos</p>
                        }
                    </div>

                    {/* Tabla */}
                    <div className="table-container" style={{ margin: 0, maxHeight: 420, overflowY: 'auto', overflowX: 'auto' }}>
                        <table className="data-table" style={{ margin: 0, fontSize: '0.75rem', width: '100%', minWidth: '400px' }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Producto</th>
                                    <th style={{ textAlign: 'center' }}>Uds.</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                                ) : products.map((p, i) => (
                                    <tr key={p.sku}>
                                        <td>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: i < 3 ? 'var(--primary)' : '#E2E8F0', color: i < 3 ? 'white' : 'var(--text)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.nombre}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}><span className="badge">{parseFloat(p.unidades).toLocaleString()}</span></td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(p.total_ventas)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Contenido Tab: Clientes */}
            {tab === 'clientes' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Gráfico */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={18} style={{ color: '#10B981' }} /> Top 10 Clientes
                        </h4>
                        {customers.length > 0
                            ? <div style={{ position: 'relative', height: '320px' }}>
                                <Bar data={customerChart} options={chartOpts} />
                            </div>
                            : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Sin datos</p>
                        }
                    </div>

                    {/* Tabla */}
                    <div className="table-container" style={{ margin: 0, maxHeight: 420, overflowY: 'auto' }}>
                        <table className="data-table" style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Cliente</th>
                                    <th style={{ textAlign: 'center' }}>Compras</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                    <th>Última</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                                ) : customers.map((c, i) => (
                                    <tr key={i}>
                                        <td>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: i < 3 ? '#10B981' : '#E2E8F0', color: i < 3 ? 'white' : 'var(--text)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.cliente}</div>
                                            {c.documento && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.documento}</div>}
                                        </td>
                                        <td style={{ textAlign: 'center' }}><span className="badge badge-blue">{c.num_compras}</span></td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>{formatCurrency(c.total_comprado)}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(c.ultima_compra + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
