import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Monitor, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CashRegisters = () => {
    const [registers, setRegisters] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRegister, setEditingRegister] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        sede_id: '',
        estado: 'ACTIVA'
    });

    const API_URL = 'http://localhost/newpos/api/public/cash-registers';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [regRes, sedeRes] = await Promise.all([
                fetch(API_URL, { headers }),
                fetch('http://localhost/newpos/api/public/sedes', { headers })
            ]);

            const regData = await regRes.json();
            const sedeData = await sedeRes.json();

            setRegisters(regData);
            setSedes(sedeData);
        } catch (error) {
            console.error('Error fetching registers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (register = null) => {
        if (register) {
            setEditingRegister(register);
            setFormData({
                nombre: register.nombre,
                sede_id: register.sede_id,
                estado: register.estado
            });
        } else {
            setEditingRegister(null);
            setFormData({
                nombre: '',
                sede_id: sedes.length > 0 ? sedes[0].id : '',
                estado: 'ACTIVA'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingRegister ? `${API_URL}/${editingRegister.id}` : API_URL;
        const method = editingRegister ? 'PUT' : 'POST';

        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al guardar caja');
            }
        } catch (error) {
            console.error('Error saving register:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta caja?')) {
            try {
                const token = localStorage.getItem('pos_token');
                const res = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    fetchData();
                } else {
                    const data = await res.json();
                    alert(data.error || 'No se pudo eliminar la caja');
                }
            } catch (error) {
                console.error('Error deleting register:', error);
            }
        }
    };

    const filteredRegisters = registers.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sede_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Maestro de Cajas</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administra las cajas físicas de tu negocio</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    Nueva Caja
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o sede..."
                            className="input-field"
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Caja</th>
                            <th>Sede</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando cajas...</td>
                            </tr>
                        ) : filteredRegisters.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron cajas</td>
                            </tr>
                        ) : (
                            filteredRegisters.map((reg) => (
                                <motion.tr
                                    key={reg.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Monitor size={18} />
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{reg.nombre}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            <MapPin size={14} />
                                            {reg.sede_nombre}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${reg.estado === 'ACTIVA' ? 'badge-emerald' : 'badge-rose'}`}>
                                            {reg.estado}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleOpenModal(reg)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.4rem' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(reg.id)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.4rem', borderColor: '#EF4444', color: '#EF4444' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            style={{ maxWidth: '450px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">{editingRegister ? 'Editar Caja' : 'Nueva Caja'}</h3>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="input-group">
                                        <label className="input-label">Nombre de la Caja</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Ej: Caja Principal"
                                        />
                                    </div>

                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Sede</label>
                                        <select
                                            required
                                            className="input-field"
                                            value={formData.sede_id}
                                            onChange={(e) => setFormData({ ...formData, sede_id: e.target.value })}
                                        >
                                            {sedes.map(sede => (
                                                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Estado</label>
                                        <select
                                            className="input-field"
                                            value={formData.estado}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        >
                                            <option value="ACTIVA">Activa</option>
                                            <option value="INACTIVA">Inactiva</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingRegister ? 'Guardar Cambios' : 'Crear Caja'}
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

export default CashRegisters;
