import React, { useState, useEffect } from 'react';
import { Banknote, LogIn, LogOut, ArrowUpCircle, ArrowDownCircle, Info, History, AlertCircle, CheckCircle, Monitor, Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, parseLocaleNumber } from '../../utils/formatters';
import { infoAlert, confirmDialog } from '../../utils/swal';

const CashManager = ({ mode, onSessionStarted, onSessionClosed }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('pos_user') || '{}'));
    const [activeSession, setActiveSession] = useState(null);
    const [allRegisters, setAllRegisters] = useState([]);
    const [selectedRegister, setSelectedRegister] = useState(null); // For Admin selection
    const [sedes, setSedes] = useState([]);
    const [registers, setRegisters] = useState([]);
    const [concepts, setConcepts] = useState([]); // All concepts
    const [loading, setLoading] = useState(true);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [movementType, setMovementType] = useState('INGRESO');
    const [editingMovement, setEditingMovement] = useState(null);
    const [sessionDetails, setSessionDetails] = useState({ totals: { total_ingresos: 0, total_egresos: 0 }, movements: [] });

    const [openFormData, setOpenFormData] = useState({
        sede_id: '',
        register_id: '',
        monto_apertura: ''
    });

    const [movementFormData, setMovementFormData] = useState({
        monto: '',
        descripcion: '',
        concept_id: ''
    });

    const [closeMonto, setCloseMonto] = useState('');

    const API_CASH = 'http://localhost/newpos/api/public/cash';
    const API_REGISTERS = 'http://localhost/newpos/api/public/cash-registers';
    const API_CONCEPTS = 'http://localhost/newpos/api/public/cash-concepts';
    const API_BASE = 'http://localhost/newpos/api/public';

    const isAdmin = user.role_id === 1 || user.role_id === 2; // Admin or Supervisor

    useEffect(() => {
        init();
    }, [mode]);

    const init = async () => {
        setLoading(true);
        if (isAdmin) {
            await fetchAllRegistersStatus();
        } else {
            await checkSession();
        }
        await fetchSedes();
        await fetchConcepts();
        setLoading(false);
    };

    const fetchConcepts = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(API_CONCEPTS, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setConcepts(data);
        } catch (error) {
            console.error('Error fetching concepts:', error);
        }
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
            if (res.ok) {
                const data = await res.json();
                setActiveSession(data);
                if (data && data.id) {
                    fetchSessionDetails(data.id);
                }
            } else if (res.status === 401) {
                // Token expired during session check
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
                monto_apertura: reg.monto_apertura || 0,
                fecha_apertura: reg.fecha_apertura
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
            if (res.ok) {
                const data = await res.json();
                setRegisters(data);
            }
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
            if (res.ok) {
                const data = await res.json();
                setSessionDetails(data);
            }
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
            const payload = {
                ...openFormData,
                monto_apertura: parseLocaleNumber(openFormData.monto_apertura)
            };
            const res = await fetch(`${API_CASH}/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                if (isAdmin) {
                    await fetchAllRegistersStatus();
                    setSelectedRegister(null);
                } else {
                    await checkSession();
                    if (onSessionStarted) onSessionStarted();
                }
            } else {
                const data = await res.json();
                infoAlert(data.error, 'Error al abrir la caja');
            }
        } catch (error) {
            console.error('Error opening cash:', error);
        }
    };

    const handleSaveMovement = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('pos_token');
            const method = editingMovement ? 'PUT' : 'POST';
            const url = editingMovement
                ? `${API_CASH}/movements/${editingMovement.id}`
                : `${API_CASH}/movements`;

            // Detect type from selected concept
            const concept = concepts.find(c => c.id == movementFormData.concept_id);
            const type = concept ? concept.tipo : movementType;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: activeSession.id,
                    tipo: type,
                    ...movementFormData,
                    monto: parseLocaleNumber(movementFormData.monto)
                })
            });
            if (res.ok) {
                setShowMovementModal(false);
                setMovementFormData({ monto: '', descripcion: '', concept_id: '' });
                setEditingMovement(null);
                fetchSessionDetails(activeSession.id);
            }
        } catch (error) {
            console.error('Error saving movement:', error);
        }
    };

    const handleDeleteMovement = async (id) => {
        if (!(await confirmDialog('¿Estás seguro de eliminar este movimiento?', '¿Eliminar movimiento?', 'Sí, eliminar'))) return;
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_CASH}/movements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchSessionDetails(activeSession.id);
            }
        } catch (error) {
            console.error('Error deleting movement:', error);
        }
    };

    const handleEditMovement = (m) => {
        setEditingMovement(m);
        setMovementFormData({
            monto: m.monto.toString(),
            descripcion: m.descripcion || '',
            concept_id: m.concept_id?.toString() || ''
        });
        setMovementType(m.tipo);
        setShowMovementModal(true);
    };

    const handleCloseCash = async () => {
        if (!closeMonto) return infoAlert('Ingresa el monto de cierre', 'Campo requerido');
        if (!(await confirmDialog('¿Estás seguro de cerrar la caja?', 'Cerrar caja', 'Sí, cerrar'))) return;

        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_CASH}/close/${activeSession.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ monto_cierre: parseLocaleNumber(closeMonto) })
            });
            if (res.ok) {
                if (isAdmin) {
                    await fetchAllRegistersStatus();
                    setSelectedRegister(null);
                } else {
                    setActiveSession(null);
                    await checkSession();
                    if (onSessionClosed) onSessionClosed();
                }
                setCloseMonto('');
            }
        } catch (error) {
            console.error('Error closing cash:', error);
        }
    };

    const handleOpenMovementModal = () => {
        setEditingMovement(null);
        setMovementFormData({ monto: '', descripcion: '', concept_id: '' });
        setShowMovementModal(true);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando información de caja...</div>;

    if (!activeSession) {
        if (mode === 'movimientos' && !isAdmin) {
            return (
                <div className="component-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <AlertCircle size={40} />
                        </div>
                        <h2 className="font-heading">Caja Cerrada</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>
                            Debes realizar la <b>Apertura de Caja</b> antes de poder registrar ingresos o gastos manuales.
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Por favor, ve al módulo de "Apertura / Cierre" para iniciar tu turno.
                        </p>
                    </div>
                </div>
            );
        }

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

        return (
            <div className="component-fade-in" style={{ maxWidth: '500px', margin: '2rem auto' }}>
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    {isAdmin && (
                        <button onClick={() => setSelectedRegister(null)} className="btn btn-ghost" style={{ position: 'absolute', left: '1rem', top: '1rem', padding: '0.4rem' }}>
                            ←
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
                    <button
                        onClick={handleOpenMovementModal}
                        className="btn btn-primary"
                    >
                        <Plus size={18} /> Registrar Movimiento
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', mb: '0.5rem' }}>Base Apertura</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(activeSession.monto_apertura || 0)}</h3>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', mb: '0.5rem' }}>Ingresos Adic.</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--emerald)' }}>+{formatCurrency(totalIngresos)}</h3>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', mb: '0.5rem' }}>Gastos/Egresos</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--rose)' }}>-{formatCurrency(totalEgresos)}</h3>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--primary)', color: 'white' }}>
                    <p style={{ opacity: 0.8, fontSize: '0.8rem', mb: '0.5rem' }}>Saldo en Caja</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(saldoActual)}</h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: mode === 'apertura' ? '1fr' : '1fr 350px', gap: '2rem', marginTop: '2rem' }}>
                {mode !== 'apertura' && (
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
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
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
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(m.created_at).toLocaleTimeString('es-CO', { hour12: true })}</td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{m.concept_name || 'Sin categoría'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.descripcion}</div>
                                            </td>
                                            <td>
                                                <span style={{ color: m.tipo === 'INGRESO' ? 'var(--emerald)' : 'var(--rose)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {m.tipo}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {m.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(m.monto)}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                    <button className="btn-action edit" onClick={() => handleEditMovement(m)}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="btn-action delete" onClick={() => handleDeleteMovement(m.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

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
                                <b>{formatCurrency(saldoActual)}</b>
                            </div>
                            <div className="flex-between" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                <span>Diferencia:</span>
                                <b style={{ color: parseFloat(closeMonto) - saldoActual < 0 ? 'var(--rose)' : 'var(--emerald)' }}>
                                    {formatCurrency(parseFloat(closeMonto) - saldoActual)}
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
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            style={{ maxWidth: '400px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">{editingMovement ? 'Editar' : 'Registrar'} Movimiento</h3>
                            </div>
                            <form onSubmit={handleSaveMovement}>
                                <div className="modal-body">
                                    <div className="input-group">
                                        <label className="input-label">Concepto / Categoría</label>
                                        <select
                                            required
                                            className="input-field"
                                            value={movementFormData.concept_id}
                                            onChange={(e) => {
                                                const cid = e.target.value;
                                                setMovementFormData({ ...movementFormData, concept_id: cid });
                                                const concept = concepts.find(c => c.id == cid);
                                                if (concept) setMovementType(concept.tipo);
                                            }}
                                        >
                                            <option value="">Selecciona un concepto</option>
                                            {concepts.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group" style={{ marginTop: '1rem' }}>
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
                                        <label className="input-label">Descripción / Detalle</label>
                                        <textarea
                                            className="input-field"
                                            rows="2"
                                            placeholder="Detalles adicionales..."
                                            value={movementFormData.descripcion}
                                            onChange={(e) => setMovementFormData({ ...movementFormData, descripcion: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowMovementModal(false)} className="btn btn-ghost">Cancelar</button>
                                    <button type="submit" className="btn btn-primary" disabled={!movementFormData.concept_id}>
                                        {editingMovement ? 'Actualizar' : 'Registrar'} Movimiento
                                    </button>
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
