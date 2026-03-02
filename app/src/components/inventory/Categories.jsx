import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { errorAlert, confirmDialog } from '../../utils/swal';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    const API_URL = 'http://localhost/newpos/api/public/categories';

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setNewCategoryName(category.nombre);
        } else {
            setEditingCategory(null);
            setNewCategoryName('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingCategory ? `${API_URL}/${editingCategory.id}` : API_URL;
        const method = editingCategory ? 'PUT' : 'POST';

        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nombre: newCategoryName })
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchCategories();
            } else {
                const data = await res.json();
                errorAlert(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!(await confirmDialog('Se verificará que no tenga productos asociados.', '¿Eliminar categoría?', 'Sí, eliminar'))) return;
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchCategories();
            } else {
                const data = await res.json();
                errorAlert(data.error || 'No se pudo eliminar la categoría');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const filteredCategories = categories.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Gestión de Categorías</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Organiza tus productos por grupos</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    Nueva Categoría
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar categoría..."
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
                            <th>Nombre de la Categoría</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando categorías...</td>
                            </tr>
                        ) : filteredCategories.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron categorías</td>
                            </tr>
                        ) : (
                            filteredCategories.map((cat) => (
                                <motion.tr
                                    key={cat.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{cat.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Tag size={16} className="text-emerald-500" />
                                            {cat.nombre}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleOpenModal(cat)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.4rem' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
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
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="input-group">
                                        <label className="input-label">Nombre de la Categoría</label>
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            className="input-field"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                                            placeholder="Ej: Electrónica, Ropa, etc."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
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

export default Categories;
