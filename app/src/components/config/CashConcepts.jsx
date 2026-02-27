import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CashConcepts = () => {
    const [concepts, setConcepts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConcept, setEditingConcept] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'INGRESO'
    });

    const API_URL = 'http://localhost/newpos/api/public/cash-concepts';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setConcepts(data);
        } catch (error) {
            console.error('Error fetching concepts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (concept = null) => {
        if (concept) {
            setEditingConcept(concept);
            setFormData({
                nombre: concept.nombre,
                tipo: concept.tipo
            });
        } else {
            setEditingConcept(null);
            setFormData({
                nombre: '',
                tipo: 'INGRESO'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingConcept ? `${API_URL}/${editingConcept.id}` : API_URL;
        const method = editingConcept ? 'PUT' : 'POST';

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
                alert(data.error || 'Error al guardar concepto');
            }
        } catch (error) {
            console.error('Error saving concept:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este concepto?')) {
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
                    alert(data.error || 'No se pudo eliminar el concepto');
                }
            } catch (error) {
                console.error('Error deleting concept:', error);
            }
        }
    };

    const filteredConcepts = concepts.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination constants
    const totalPages = Math.ceil(filteredConcepts.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredConcepts.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Conceptos de Caja</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Define categorías para tus ingresos y gastos manuales</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    Nuevo Concepto
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar concepto..."
                            className="input-field"
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Tipo</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>Cargando...</td></tr>
                        ) : currentItems.length === 0 ? (
                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>No hay conceptos registrados</td></tr>
                        ) : (
                            currentItems.map((concept) => (
                                <tr key={concept.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Tag size={16} />
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{concept.nombre}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${concept.tipo === 'INGRESO' ? 'badge-emerald' : 'badge-rose'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {concept.tipo === 'INGRESO' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                                            {concept.tipo}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button onClick={() => handleOpenModal(concept)} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(concept.id)} className="btn btn-ghost" style={{ padding: '0.4rem', color: '#EF4444' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #E2E8F0',
                        background: '#F8FAFC'
                    }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Mostrando <b>{indexOfFirstItem + 1}</b> - <b>{Math.min(indexOfLastItem, filteredConcepts.length)}</b> de <b>{filteredConcepts.length}</b> resultads
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="btn btn-ghost"
                                style={{ padding: '0.4rem 0.8rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                            >
                                Anterior
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`btn ${currentPage === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '0.4rem 0.8rem', minWidth: '38px' }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="btn btn-ghost"
                                style={{ padding: '0.4rem 0.8rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
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
                            style={{ maxWidth: '400px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">{editingConcept ? 'Editar Concepto' : 'Nuevo Concepto'}</h3>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="input-group">
                                        <label className="input-label">Nombre del Concepto</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                                            placeholder="Ej: Pago de Luz"
                                        />
                                    </div>

                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Tipo de Movimiento</label>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <label style={{ flex: 1, cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="tipo"
                                                    value="INGRESO"
                                                    checked={formData.tipo === 'INGRESO'}
                                                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                                    style={{ display: 'none' }}
                                                />
                                                <div style={{
                                                    padding: '0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    textAlign: 'center',
                                                    border: `2px solid ${formData.tipo === 'INGRESO' ? 'var(--emerald)' : 'transparent'}`,
                                                    background: formData.tipo === 'INGRESO' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)'
                                                }}>
                                                    <ArrowUpCircle size={20} color="var(--emerald)" style={{ margin: '0 auto 0.25rem' }} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>INGRESO</span>
                                                </div>
                                            </label>
                                            <label style={{ flex: 1, cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="tipo"
                                                    value="GASTO"
                                                    checked={formData.tipo === 'GASTO'}
                                                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                                    style={{ display: 'none' }}
                                                />
                                                <div style={{
                                                    padding: '0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    textAlign: 'center',
                                                    border: `2px solid ${formData.tipo === 'GASTO' ? 'var(--rose)' : 'transparent'}`,
                                                    background: formData.tipo === 'GASTO' ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-card)'
                                                }}>
                                                    <ArrowDownCircle size={20} color="var(--rose)" style={{ margin: '0 auto 0.25rem' }} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>GASTO</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingConcept ? 'Guardar Cambios' : 'Crear Concepto'}
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

export default CashConcepts;
