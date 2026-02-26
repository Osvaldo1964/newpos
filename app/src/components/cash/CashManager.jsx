import React, { useState, useEffect } from 'react';
import { Banknote, LogIn, LogOut, ArrowUpCircle, ArrowDownCircle, Info, History, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CashManager = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('pos_user') || '{}'));
    const [activeSession, setActiveSession] = useState(null);
    const [allRegisters, setAllRegisters] = useState([]);
    const [selectedRegister, setSelectedRegister] = useState(null); // For Admin selection
    const [sedes, setSedes] = useState([]);
    const [registers, setRegisters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [movementType, setMovementType] = useState('INGRESO');
    const [sessionDetails, setSessionDetails] = useState({ totals: { total_ingresos: 0, total_egresos: 0 }, movements: [] });

    const [openFormData, setOpenFormData] = useState({
        sede_id: '',
        register_id: '',
        monto_apertura: ''
    });

    const [movementFormData, setMovementFormData] = useState({
        monto: '',
        descripcion: ''
    });

    const [closeMonto, setCloseMonto] = useState('');

    const API_CASH = 'http://localhost/newpos/api/public/cash';
    const API_REGISTERS = 'http://localhost/newpos/api/public/cash-registers';
    const API_BASE = 'http://localhost/newpos/api/public';

    const isAdmin = user.role_id === 1 || user.role_id === 2; // Admin or Supervisor

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        setLoading(true);
        if (isAdmin) {
            await fetchAllRegistersStatus();
        } else {
            await checkSession();
        }
        await fetchSedes();
        setLoading(false);
    };

    const fetchAllRegistersStatus = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_REGISTERS}/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAllRegisters(data);
        } catch (error) {
            console.error('Error fetching registers status:', error);
        }
    };

    const checkSession = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_CASH}/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setActiveSession(data);
            if (data) {
                fetchSessionDetails(data.id);
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    };

    const handleSelectRegister = (reg) => {
        setSelectedRegister(reg);
        if (reg.active_session_id) {
            // If open, fetch details
            setActiveSession({
                id: reg.active_session_id,
                register_id: reg.id,
                register_name: reg.nombre,
                sede_id: reg.sede_id,
                sede_name: reg.sede_nombre,
                monto_apertura: reg.monto_apertura || 0, // Need to make sure monto_apertura is in the status join if possible, or just fetch it
                fecha_apertura: reg.fecha_apertura // Add these to the status SQL
            });
            fetchSessionDetails(reg.active_session_id);
        } else {
            // If closed, prepare opening form
            setActiveSession(null);
            setOpenFormData({
                sede_id: reg.sede_id,
                register_id: reg.id,
                monto_apertura: ''
            });
        }
    };

    const fetchSedes = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_BASE}/sedes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSedes(data);
        } catch (error) {
            console.error('Error fetching sedes:', error);
        }
    };

    const fetchRegisters = async (sedeId) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_REGISTERS}/sede/${sedeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRegisters(data);
        } catch (error) {
            console.error('Error fetching registers:', error);
        }
    };

    const fetchSessionDetails = async (sessionId) => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_CASH}/session/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSessionDetails(data);
        } catch (error) {
            console.error('Error fetching session details:', error);
        }
    };

    const handleOpenSedeChange = (e) => {
        const id = e.target.value;
        setOpenFormData({ ...openFormData, sede_id: id, register_id: '' });
        fetchRegisters(id);
    };

    const handleOpenCash = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_CASH}/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(openFormData)
            });
            if (res.ok) {
                if (isAdmin) {
                    await fetchAllRegistersStatus();
                    setSelectedRegister(null);
                } else {
                    await checkSession();
                }
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (error) {
            console.error('Error opening cash:', error);
        }
    };

    const handleAddMovement = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_CASH}/movements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: activeSession.id,
                    tipo: movementType,
                    ...movementFormData
                })
            });
            if (res.ok) {
                setShowMovementModal(false);
                setMovementFormData({ monto: '', descripcion: '' });
                fetchSessionDetails(activeSession.id);
            }
        } catch (error) {
            console.error('Error adding movement:', error);
        }
    };

    const handleCloseCash = async () => {
        if (!closeMonto) return alert('Ingresa el monto de cierre');
        if (!window.confirm('¿Estás seguro de cerrar la caja?')) return;

        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_CASH}/close/${activeSession.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ monto_cierre: closeMonto })
            });
            if (res.ok) {
                if (isAdmin) {
                    await fetchAllRegistersStatus();
                    setSelectedRegister(null);
                } else {
                    setActiveSession(null);
                    await checkSession();
                }
                setCloseMonto('');
            }
        } catch (error) {
            console.error('Error closing cash:', error);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando información de caja...</div>;

    // Admin List View
    if (isAdmin && !selectedRegister) {
        return (
            <div className="component-fade-in">
                <div className="flex-between">
                    <div>
                        <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Seleccionar Caja</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Elige una caja para abrir, cerrar o supervisar movimientos</p>
                    </div>
                    <button onClick={fetchAllRegistersStatus} className="btn btn-ghost">
                        <History size={18} /> Actualizar
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                    {allRegisters.map(reg => (
                        <motion.div
                            key={reg.id}
                            whileHover={{ y: -4 }}
                            className="glass clickable"
                            style={{
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                borderLeft: `6px solid ${reg.active_session_id ? 'var(--emerald)' : 'var(--text-muted)'}`
                            }}
                            onClick={() => handleSelectRegister(reg)}
                        >
                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Monitor size={20} color={reg.active_session_id ? 'var(--emerald)' : 'var(--text-muted)'} />
                                    <h4 className="font-heading">{reg.nombre}</h4>
                                </div>
                                <span className={`badge ${reg.active_session_id ? 'badge-emerald' : 'badge-slate'}`}>
                                    {reg.active_session_id ? 'ABIERTA' : 'CERRADA'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Info size={14} /> {reg.sede_nombre}
                                </p>
                                {reg.session_user_name && (
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        <LogIn size={14} /> Atendida por: {reg.session_user_name}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    if (!activeSession && (!isAdmin || selectedRegister)) {
        return (
            <div className="component-fade-in" style={{ maxWidth: '500px', margin: '2rem auto' }}>
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    {isAdmin && (
                        <button onClick={() => setSelectedRegister(null)} className="btn btn-ghost" style={{ position: 'absolute', left: '1rem', top: '1rem' }}>
                            Volver
                        </button>
                    )}
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <LogIn size={32} />
                    </div>
                    <h2 className="font-heading" style={{ marginBottom: '0.5rem' }}>Apertura de Caja</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {selectedRegister ? `Abriendo sesión para ${selectedRegister.nombre}` : 'No tienes una sesión de caja activa. Por favor, selecciona una sede para ver cajas disponibles.'}
                    </p>

                    <form onSubmit={handleOpenCash} style={{ textAlign: 'left' }}>
                        {!selectedRegister && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Sede</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={openFormData.sede_id}
                                        onChange={handleOpenSedeChange}
                                    >
                                        <option value="">Selecciona una sede</option>
                                        {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginTop: '1rem' }}>
                                    <label className="input-label">Caja Disponible</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={openFormData.register_id}
                                        onChange={(e) => setOpenFormData({ ...openFormData, register_id: e.target.value })}
                                    >
                                        <option value="">Selecciona una caja</option>
                                        {registers.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        <div className="input-group" style={{ marginTop: '1rem' }}>
                            <label className="input-label">Monto de Apertura (Base)</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                placeholder="0.00"
                                value={openFormData.monto_apertura}
                                onChange={(e) => setOpenFormData({ ...openFormData, monto_apertura: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}
                            disabled={!openFormData.register_id}
                        >
                            <CheckCircle size={20} />
                            Abrir Caja Ahora
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const totalIngresos = parseFloat(sessionDetails.totals.total_ingresos || 0);
    const totalEgresos = parseFloat(sessionDetails.totals.total_egresos || 0);
    const saldoActual = parseFloat(activeSession.monto_apertura || 0) + totalIngresos - totalEgresos;

    return (
        <div className="component-fade-in">
            {isAdmin && (
                <button onClick={() => setSelectedRegister(null)} className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
                    ← Volver a lista de cajas
                </button>
            )}
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Caja en Línea</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <span className="badge badge-emerald">ABIERTA</span>
                        <span>{activeSession.register_name} - {activeSession.sede_name}</span>
                        {activeSession.session_user_name && <span>• Atendida por: <b>{activeSession.session_user_name}</b></span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => { setMovementType('INGRESO'); setShowMovementModal(true); }} className="btn btn-ghost" style={{ borderColor: 'var(--emerald)', color: 'var(--emerald)' }}>
                        <ArrowUpCircle size={18} /> Ingreso
                    </button>
                    <button onClick={() => { setMovementType('GASTO'); setShowMovementModal(true); }} className="btn btn-ghost" style={{ borderColor: 'var(--rose)', color: 'var(--rose)' }}>
                        <ArrowDownCircle size={18} /> Gasto
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', mb: '0.5rem' }}>Base Apertura</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>${parseFloat(activeSession.monto_apertura || 0).toLocaleString()}</h3>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', mb: '0.5rem' }}>Ingresos Adic.</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--emerald)' }}>+${totalIngresos.toLocaleString()}</h3>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', mb: '0.5rem' }}>Gastos/Egresos</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--rose)' }}>-${totalEgresos.toLocaleString()}</h3>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--primary)', color: 'white' }}>
                    <p style={{ opacity: 0.8, fontSize: '0.8rem', mb: '0.5rem' }}>Saldo en Caja</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>${saldoActual.toLocaleString()}</h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', marginTop: '2rem' }}>
                <div className="table-container" style={{ height: 'fit-content' }}>
                    <div className="table-header flex-between">
                        <h4 className="font-heading">Movimientos de la Sesión</h4>
                        <History size={18} color="var(--text-muted)" />
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Concepto</th>
                                <th>Tipo</th>
                                <th style={{ textAlign: 'right' }}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessionDetails.movements.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay movimientos registrados</td>
                                </tr>
                            ) : (
                                sessionDetails.movements.map((m, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontSize: '0.85rem' }}>{new Date(m.created_at).toLocaleTimeString()}</td>
                                        <td>{m.descripcion}</td>
                                        <td>
                                            <span style={{ color: m.tipo === 'INGRESO' ? 'var(--emerald)' : 'var(--rose)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                {m.tipo}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {m.tipo === 'INGRESO' ? '+' : '-'}${parseFloat(m.monto).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
                    <h4 className="font-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LogOut size={18} /> Arqueo y Cierre
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0' }}>Ingresa el monto físico contado en caja para finalizar el turno.</p>

                    <div className="input-group">
                        <label className="input-label">Monto de Cierre (Efectivo)</label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder="0.00"
                            value={closeMonto}
                            onChange={(e) => setCloseMonto(e.target.value)}
                        />
                    </div>

                    {closeMonto && (
                        <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: `${parseFloat(closeMonto) === saldoActual ? 'var(--emerald)' : 'var(--rose)'}15` }}>
                            <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                                <span>Esperado:</span>
                                <b>${saldoActual.toLocaleString()}</b>
                            </div>
                            <div className="flex-between" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                <span>Diferencia:</span>
                                <b style={{ color: parseFloat(closeMonto) - saldoActual < 0 ? 'var(--rose)' : 'var(--emerald)' }}>
                                    ${(parseFloat(closeMonto) - saldoActual).toLocaleString()}
                                </b>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleCloseCash}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1.5rem', background: 'var(--text-main)' }}
                    >
                        Cerrar Turno de Caja
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                        <AlertCircle size={12} /> El cierre es definitivo y genera un reporte de auditoría.
                    </p>
                </div>
            </div>

            {/* Movement Modal */}
            <AnimatePresence>
                {showMovementModal && (
                    <div className="modal-overlay" onClick={() => setShowMovementModal(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            style={{ maxWidth: '400px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">Manual {movementType}</h3>
                            </div>
                            <form onSubmit={handleAddMovement}>
                                <div className="modal-body">
                                    <div className="input-group">
                                        <label className="input-label">Monto</label>
                                        <input
                                            type="number"
                                            required
                                            className="input-field"
                                            value={movementFormData.monto}
                                            onChange={(e) => setMovementFormData({ ...movementFormData, monto: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Descripción / Motivo</label>
                                        <textarea
                                            required
                                            className="input-field"
                                            rows="3"
                                            value={movementFormData.descripcion}
                                            onChange={(e) => setMovementFormData({ ...movementFormData, descripcion: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowMovementModal(false)} className="btn btn-ghost">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Registrar {movementType}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CashManager;
