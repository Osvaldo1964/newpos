import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Globe, MapPin, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { errorAlert, confirmDialog } from '../../utils/swal';

const Sedes = () => {
    const [sedes, setSedes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSede, setEditingSede] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: ''
    });

    const API_URL = 'http://localhost/newpos/api/public/sedes';

    useEffect(() => {
        fetchSedes();
    }, []);

    const fetchSedes = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSedes(data);
        } catch (error) {
            console.error('Error fetching sedes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (sede = null) => {
        if (sede) {
            setEditingSede(sede);
            setFormData({
                nombre: sede.nombre,
                direccion: sede.direccion || '',
                telefono: sede.telefono || ''
            });
        } else {
            setEditingSede(null);
            setFormData({
                nombre: '',
                direccion: '',
                telefono: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingSede ? `${API_URL}/${editingSede.id}` : API_URL;
        const method = editingSede ? 'PUT' : 'POST';

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
                fetchSedes();
            } else {
                const data = await res.json();
                errorAlert(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving sede:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!(await confirmDialog('Se verificará que no tenga bodegas o usuarios asociados.', '¿Eliminar sede?', 'Sí, eliminar'))) return;
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchSedes();
            } else {
                const data = await res.json();
                errorAlert(data.error || 'No se pudo eliminar la sede');
            }
        } catch (error) {
            console.error('Error deleting sede:', error);
        }
    };

    const filteredSedes = sedes.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.direccion && s.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Gestión de Sedes / Sucursales</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administra los puntos físicos de tu negocio</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    Nueva Sede
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar sede por nombre o dirección..."
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
                            <th style={{ width: '80px' }}>ID</th>
                            <th>Nombre de la Sede</th>
                            <th>Dirección</th>
                            <th>Teléfono</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando sedes...</td>
                            </tr>
                        ) : filteredSedes.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron sedes</td>
                            </tr>
                        ) : (
                            filteredSedes.map((sede) => (
                                <motion.tr
                                    key={sede.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{sede.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Globe size={16} style={{ color: '#3B82F6' }} />
                                            {sede.nombre}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <MapPin size={14} />
                                            {sede.direccion || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <Phone size={14} />
                                            {sede.telefono || 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleOpenModal(sede)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.4rem' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(sede.id)}
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
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content"
                            style={{ maxWidth: '500px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">{editingSede ? 'Editar Sede' : 'Nueva Sede'}</h3>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="input-group">
                                        <label className="input-label">Nombre de la Sede</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                                            placeholder="Ej: Sede Norte, Sucursal Cali, etc."
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Dirección</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            placeholder="Calle... # ..."
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Teléfono de Contacto</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            placeholder="Ej: +57 300..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingSede ? 'Guardar Cambios' : 'Crear Sede'}
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

export default Sedes;
