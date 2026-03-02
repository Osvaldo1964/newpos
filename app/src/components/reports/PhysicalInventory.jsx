import React, { useState, useEffect } from 'react';
import { Warehouse, Search, Printer, Package, DollarSign, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import StoreHeader from './StoreHeader';

const API = 'http://localhost/newpos/api/public/inventory';

export default function PhysicalInventory() {
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [grouped, setGrouped] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('pos_token');
        fetch(`${API}/warehouses`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(setWarehouses);
        fetchData('');
    }, []);

    const fetchData = async (wid) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('pos_token');
            const q = wid ? `?warehouse_id=${wid}` : '';
            const res = await fetch(`${API}/reports/physical-inventory${q}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGrouped(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => fetchData(selectedWarehouse);

    // Grand totals
    const allItems = Object.values(grouped).flat();
    const totalItems = allItems.length;
    const totalUnits = allItems.reduce((s, r) => s + parseFloat(r.stock_sistema || 0), 0);
    const totalValue = allItems.reduce((s, r) => s + parseFloat(r.valor_inventario || 0), 0);

    const handlePrint = () => {
        const printContent = document.getElementById('inventory-print-area');
        const w = window.open('', '_blank');
        w.document.write(`
            <html><head><title>Inventario Físico</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #1E3A8A; color: white; padding: 6px 8px; text-align: left; }
                td { border-bottom: 1px solid #eee; padding: 5px 8px; }
                h2 { color: #1E3A8A; margin-top: 20px; }
                .text-right { text-align: right; }
                .tfoot-row { font-weight: bold; background: #f0f4ff; }
                .count-col { background: #FFF9C4; border: 2px dashed #F59E0B; min-width: 80px; }
                @media print { button { display: none; } }
            </style></head><body>
            ${printContent.innerHTML}
            </body></html>
        `);
        w.document.close();
        w.print();
    };

    return (
        <div className="component-fade-in">
            <StoreHeader />
            {/* Encabezado y Opciones de Filtro */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 className="font-heading">Inventario Físico</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Planilla de toma de inventario físico por bodega — imprime y registra el conteo real</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        className="input-field"
                        style={{ minWidth: '200px' }}
                        value={selectedWarehouse}
                        onChange={e => setSelectedWarehouse(e.target.value)}
                    >
                        <option value="">Todas las bodegas</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={handleFilter} disabled={loading}>
                        <Search size={16} />{loading ? 'Cargando...' : 'Filtrar'}
                    </button>
                    <button className="btn btn-ghost" onClick={handlePrint}>
                        <Printer size={16} /> Imprimir Planilla
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Referencias', value: totalItems, icon: <Package size={20} />, color: '#1E3A8A' },
                    { label: 'Unidades en Stock', value: totalUnits.toLocaleString(), icon: <TrendingDown size={20} />, color: '#10B981' },
                    { label: 'Valor Total Inventario', value: formatCurrency(totalValue), icon: <DollarSign size={20} />, color: '#F59E0B' },
                    { label: 'Bodegas', value: Object.keys(grouped).length, icon: <Warehouse size={20} />, color: '#8B5CF6' },
                ].map(kpi => (
                    <div key={kpi.label} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${kpi.color}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '10px', background: `${kpi.color}15`, color: kpi.color }}>{kpi.icon}</div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{kpi.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info de columna de conteo */}
            <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400E' }}>
                    La columna <strong>"Conteo Físico"</strong> (en amarillo) está vacía para que puedas escribir en la planilla impresa. Compara con el stock del sistema para detectar diferencias.
                </p>
            </div>

            {/* Planilla por bodega */}
            <div id="inventory-print-area">
                <h3 style={{ marginBottom: '1rem' }}>
                    Planilla de Inventario Físico — {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                </h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando...</div>
                ) : Object.keys(grouped).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Sin datos de inventario</div>
                ) : (
                    Object.entries(grouped).map(([bodega, items]) => {
                        const bodegaTotal = items.reduce((s, r) => s + parseFloat(r.valor_inventario || 0), 0);
                        const bodegaUnits = items.reduce((s, r) => s + parseFloat(r.stock_sistema || 0), 0);
                        return (
                            <div key={bodega} style={{ marginBottom: '2rem' }}>
                                {/* Bodega header */}
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Warehouse size={18} />
                                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{bodega}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
                                        <span>{items.length} referencias</span>
                                        <span>{bodegaUnits.toLocaleString()} uds.</span>
                                        <span style={{ fontWeight: 700 }}>{formatCurrency(bodegaTotal)}</span>
                                    </div>
                                </div>

                                <table className="data-table" style={{ margin: 0, borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', overflow: 'hidden' }}>
                                    <thead>
                                        <tr>
                                            <th>SKU</th>
                                            <th>Categoría</th>
                                            <th>Producto</th>
                                            <th style={{ textAlign: 'center' }}>Stock Sistema</th>
                                            <th style={{ textAlign: 'center', background: '#FEF3C7', color: '#92400E' }}>Conteo Físico</th>
                                            <th style={{ textAlign: 'center' }}>Diferencia</th>
                                            <th style={{ textAlign: 'right' }}>Precio Base</th>
                                            <th style={{ textAlign: 'right' }}>Valor Sistema</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#F8FAFC' }}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.sku}</td>
                                                <td style={{ fontSize: '0.85rem' }}>{item.categoria}</td>
                                                <td style={{ fontWeight: 600 }}>{item.producto}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                                                    {parseFloat(item.stock_sistema).toLocaleString()}
                                                </td>
                                                <td style={{ textAlign: 'center', background: '#FFF9C4', border: '2px dashed #F59E0B', minWidth: '80px' }}>
                                                    {/* Campo de conteo — vacío para impresión */}
                                                </td>
                                                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                                    —
                                                </td>
                                                <td style={{ textAlign: 'right', fontSize: '0.875rem' }}>{formatCurrency(item.precio_base)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.valor_inventario)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ fontWeight: 700, background: '#EEF2FF' }}>
                                            <td colSpan="3">TOTAL BODEGA</td>
                                            <td style={{ textAlign: 'center' }}>{bodegaUnits.toLocaleString()}</td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(bodegaTotal)}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {/* Firma */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4rem', marginTop: '1rem', padding: '0 1rem', pageBreakAfter: 'always' }}>
                                    {['Responsable Conteo', 'Supervisor'].map(label => (
                                        <div key={label} style={{ textAlign: 'center' }}>
                                            <div style={{ borderBottom: '1px solid #999', width: '160px', marginBottom: '4px' }}></div>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
