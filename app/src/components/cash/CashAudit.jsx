import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, Calendar, MapPin, User as UserIcon, Monitor, ArrowUpCircle, ArrowDownCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CashAudit = () => {
    const [sessions, setSessions] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSede, setSelectedSede] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const [details, setDetails] = useState({ totals: { total_ingresos: 0, total_egresos: 0 }, movements: [] });
    const [detailsLoading, setDetailsLoading] = useState(false);

    const API_CASH = 'http://localhost/newpos/api/public/cash';
    const API_BASE = 'http://localhost/newpos/api/public';

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [sedeRes, sessionRes] = await Promise.all([
                fetch(`${API_BASE}/sedes`, { headers }),
                fetch(`${API_CASH}/audit`, { headers })
            ]);

            setSedes(await sedeRes.json());
            setSessions(await sessionRes.json());
        } catch (error) {
            console.error('Error fetching audit data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = async (sedeId) => {
        setSelectedSede(sedeId);
        setLoading(true);
        try {
            const token = localStorage.getItem('pos_token');
            const url = sedeId ? `${API_CASH}/audit?sede_id=${sedeId}` : `${API_CASH}/audit`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSessions(await res.json());
        } catch (error) {
            console.error('Error filtering sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewDetails = async (session) => {
        setSelectedSession(session);
        setDetailsLoading(true);
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_CASH}/session/${session.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setDetails(await res.json());
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Auditoría de Cajas</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Histórico de aperturas, cierres y arqueos</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <select
                            className="input-field"
                            style={{ paddingLeft: '2.5rem', width: '200px' }}
                            value={selectedSede}
                            onChange={(e) => handleFilter(e.target.value)}
                        >
                            <option value="">Todas las Sedes</option>
                            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedSession ? '1fr 400px' : '1fr', gap: '2rem', marginTop: '2rem', transition: 'all 0.3s' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha Apertura</th>
                                <th>Sede / Caja</th>
                                <th>Cajero</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Diferencia</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Cargando historial...</td></tr>
                            ) : sessions.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>No hay registros de caja</td></tr>
                            ) : (
                                sessions.map((s) => {
                                    const diff = s.estado === 'CERRADA' ? parseFloat(s.monto_cierre) - (parseFloat(s.monto_apertura)) : 0;
                                    return (
                                        <tr key={s.id} className={selectedSession?.id === s.id ? 'row-selected' : ''}>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 600 }}>{new Date(s.fecha_apertura).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(s.fecha_apertura).toLocaleTimeString()}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.register_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.sede_name}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                    <UserIcon size={14} className="text-blue-500" />
                                                    {s.user_name}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${s.estado === 'ABIERTA' ? 'badge-emerald' : 'badge-slate'}`}>
                                                    {s.estado}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {s.estado === 'CERRADA' ? (
                                                    <span style={{ color: diff >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                                                        ${diff.toLocaleString()}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button onClick={() => viewDetails(s)} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <AnimatePresence>
                    {selectedSession && (
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className="glass"
                            style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', height: 'fit-content', position: 'sticky', top: '2rem' }}
                        >
                            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                <h4 className="font-heading">Detalles de Sesión</h4>
                                <button onClick={() => setSelectedSession(null)} className="btn btn-ghost" style={{ padding: '0.25rem' }}>×</button>
                            </div>

                            {detailsLoading ? <p>Cargando movimientos...</p> : (
                                <>
                                    <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                        <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                            <span>Monto Apertura:</span>
                                            <b>${parseFloat(selectedSession.monto_apertura).toLocaleString()}</b>
                                        </div>
                                        <div className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--emerald)', marginBottom: '0.5rem' }}>
                                            <span>Ingresos:</span>
                                            <b>+${parseFloat(details.totals.total_ingresos || 0).toLocaleString()}</b>
                                        </div>
                                        <div className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--rose)', marginBottom: '0.5rem' }}>
                                            <span>Egresos:</span>
                                            <b>-${parseFloat(details.totals.total_egresos || 0).toLocaleString()}</b>
                                        </div>
                                        <div className="flex-between" style={{ fontSize: '1rem', fontWeight: 700, borderTop: '1px solid #ddd', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                            <span>Cierre:</span>
                                            <span>${selectedSession.monto_cierre ? parseFloat(selectedSession.monto_cierre).toLocaleString() : 'PENDIENTE'}</span>
                                        </div>
                                    </div>

                                    <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Movimientos</h5>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {details.movements.length === 0 ? <p style={{ fontSize: '0.85rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sin movimientos</p> :
                                            details.movements.map((m, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{m.descripcion}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleTimeString()}</div>
                                                    </div>
                                                    <div style={{ color: m.tipo === 'INGRESO' ? 'var(--emerald)' : 'var(--rose)', fontWeight: 700 }}>
                                                        {m.tipo === 'INGRESO' ? '+' : '-'}${parseFloat(m.monto).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CashAudit;
