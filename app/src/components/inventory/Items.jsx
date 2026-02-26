import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Tag, DollarSign, Percent, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Items = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        sku: '',
        nombre: '',
        descripcion: '',
        precio_base: 0,
        iva: 0,
        category_id: ''
    });

    const API_URL = 'http://localhost/newpos/api/public/inventory';
    const BASE_URL = 'http://localhost/newpos/api/public/';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const [prodRes, catRes] = await Promise.all([
                fetch(`${API_URL}/products`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/categories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const prodData = await prodRes.json();
            const catData = await catRes.json();
            setProducts(prodData);
            setCategories(catData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                sku: product.sku,
                nombre: product.nombre,
                descripcion: product.descripcion,
                precio_base: product.precio_base,
                iva: product.iva,
                category_id: product.category_id
            });
            setPreviews(product.main_image ? [`${BASE_URL}${product.main_image}`] : []);
        } else {
            setEditingProduct(null);
            setFormData({
                sku: '',
                nombre: '',
                descripcion: '',
                precio_base: 0,
                iva: 0,
                category_id: ''
            });
            setPreviews([]);
        }
        setSelectedFiles([]);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;

        // Use FormData for file uploads
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));

        selectedFiles.forEach((file, index) => {
            data.append('images[]', file);
        });

        // Simulating PUT with POST if needed, but modern Slim handles PUT multipart sometimes tricky. 
        // For simplicity, we'll use POST for both if we want easy file handling, or just check backend.
        // Let's stick to what we have in Controller (POST for create, PUT for update).
        const method = editingProduct ? 'POST' : 'POST';
        // Note: Slim / PHP $_FILES is only populated on POST. 
        // To use PUT with files, we'd need to manually parse the stream. 
        // Alternative: Use a hidden field _METHOD or just change update to POST for now.

        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(url + (editingProduct ? '?_METHOD=PUT' : ''), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                const token = localStorage.getItem('pos_token');
                await fetch(`${API_URL}/products/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchData();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Catálogo de Productos</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona tus items, categorías y fotos</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    Nuevo Producto
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
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
                            <th style={{ width: '80px' }}>Foto</th>
                            <th>SKU</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th style={{ textAlign: 'right' }}>Precio</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando productos...</td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron productos</td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <motion.tr
                                    key={product.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: '#F1F5F9', display: 'flex', alignItems: 'center', justify: 'center' }}>
                                            {product.main_image ? (
                                                <img src={`${BASE_URL}${product.main_image}`} alt={product.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <ImageIcon size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{product.sku}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{product.nombre}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.descripcion}</div>
                                    </td>
                                    <td>
                                        <span className="badge badge-blue">
                                            {product.category_name || 'Sin categoría'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                        ${parseFloat(product.precio_base).toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.4rem' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
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
                            style={{ maxWidth: '1100px', width: '95vw' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header" style={{ padding: '2rem 2.5rem' }}>
                                <h3 className="font-heading" style={{ fontSize: '1.75rem' }}>{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                                    <X size={28} />
                                </button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body" style={{ maxHeight: '85vh', overflowY: 'auto', padding: '2.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '4rem' }}>
                                        {/* Image Upload Area */}
                                        <div className="input-group">
                                            <label className="input-label" style={{ marginBottom: '0.75rem' }}>Fotos del Producto</label>
                                            <div
                                                onClick={() => fileInputRef.current.click()}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    border: '2px dashed #CBD5E1',
                                                    borderRadius: '16px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                    background: '#F8FAFC',
                                                    position: 'relative',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
                                                onMouseOut={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
                                            >
                                                {previews.length > 0 ? (
                                                    <img src={previews[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                                                        <Upload size={32} className="text-gray-400" style={{ marginBottom: '0.5rem' }} />
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Haz clic para subir fotos</p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    multiple
                                                    hidden
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                />
                                            </div>
                                            {previews.length > 1 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
                                                    {previews.slice(1).map((p, i) => (
                                                        <div key={i} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                                            <img src={p} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Details Area */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div className="input-group">
                                                    <label className="input-label">SKU / Código</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Ej: PROD-001"
                                                        className="input-field"
                                                        value={formData.sku}
                                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Categoría</label>
                                                    <select
                                                        required
                                                        className="input-field"
                                                        value={formData.category_id}
                                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                                    >
                                                        <option value="">Seleccionar categoría...</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="input-group">
                                                <label className="input-label">Nombre del Producto</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Ej: Camiseta de Algodón Premium"
                                                    className="input-field"
                                                    value={formData.nombre}
                                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div className="input-group">
                                                    <label className="input-label">Precio Base (Antes de IVA)</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                        <input
                                                            type="number"
                                                            required
                                                            step="0.01"
                                                            className="input-field"
                                                            style={{ paddingLeft: '2.5rem' }}
                                                            value={formData.precio_base}
                                                            onChange={(e) => setFormData({ ...formData, precio_base: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">IVA (%)</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <Percent size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                        <input
                                                            type="number"
                                                            required
                                                            step="0.01"
                                                            className="input-field"
                                                            style={{ paddingLeft: '2.5rem' }}
                                                            value={formData.iva}
                                                            onChange={(e) => setFormData({ ...formData, iva: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ marginTop: '2rem' }}>
                                        <label className="input-label">Descripción Detallada</label>
                                        <textarea
                                            className="input-field"
                                            style={{ height: '120px', resize: 'none', padding: '1rem' }}
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            placeholder="Describe las características principales, materiales, dimensiones, etc."
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ padding: '1.5rem 2rem' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.75rem 1.5rem' }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                        {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
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

export default Items;
