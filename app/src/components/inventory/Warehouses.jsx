import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Warehouses = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        sede_id: ''
    });

    const API_URL = 'http://localhost/newpos/api/public/inventory';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const [wareRes, sedeRes] = await Promise.all([
                fetch(`${API_URL}/warehouses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/sedes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const wareData = await wareRes.json();
            const sedeData = await sedeRes.json();
            setWarehouses(wareData);
            setSedes(sedeData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (warehouse = null) => {
        if (warehouse) {
            setEditingWarehouse(warehouse);
            setFormData({
                nombre: warehouse.nombre,
                sede_id: warehouse.sede_id
            });
        } else {
            setEditingWarehouse(null);
            setFormData({
                nombre: '',
                sede_id: sedes.length > 0 ? sedes[0].id : ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingWarehouse ? `${API_URL}/warehouses/${editingWarehouse.id}` : `${API_URL}/warehouses`;
        const method = editingWarehouse ? 'PUT' : 'POST';

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
                alert(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving warehouse:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta bodega? Se verificará que esté vacía.')) {
            try {
                const token = localStorage.getItem('pos_token');
                const res = await fetch(`${API_URL}/warehouses/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    fetchData();
                } else {
                    const data = await res.json();
                    alert(data.error || 'No se pudo eliminar la bodega');
                }
            } catch (error) {
                console.error('Error deleting warehouse:', error);
            }
        }
    };

    const filteredWarehouses = warehouses.filter(w =>
        w.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.sede_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Gestión de Bodegas</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Controla ubicaciones y puntos de almacenamiento</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    Nueva Bodega
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar bodega o sede..."
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
                            <th>Nombre de la Bodega</th>
                            <th>Sede / Ubicación</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando bodegas...</td>
                            </tr>
                        ) : filteredWarehouses.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron bodegas</td>
                            </tr>
                        ) : (
                            filteredWarehouses.map((ware) => (
                                <motion.tr
                                    key={ware.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{ware.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Package size={16} className="text-secondary" />
                                            {ware.nombre}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <MapPin size={14} />
                                            {ware.sede_name}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleOpenModal(ware)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.4rem' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ware.id)}
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
                                <h3 className="font-heading">{editingWarehouse ? 'Editar Bodega' : 'Nueva Bodega'}</h3>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="input-group">
                                        <label className="input-label">Nombre de la Bodega</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                                            placeholder="Ej: Bodega Central, Depósito 1, etc."
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Sede / Ubicación</label>
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
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingWarehouse ? 'Guardar Cambios' : 'Crear Bodega'}
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

export default Warehouses;
