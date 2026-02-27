import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, User as UserIcon, Shield, MapPin, X, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        role_id: '',
        sede_id: '',
        status: 1
    });

    const API_URL = 'http://localhost/newpos/api/public';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [userRes, roleRes, sedeRes] = await Promise.all([
                fetch(`${API_URL}/users`, { headers }),
                fetch(`${API_URL}/roles`, { headers }),
                fetch(`${API_URL}/sedes`, { headers })
            ]);

            const userData = await userRes.json();
            const roleData = await roleRes.json();
            const sedeData = await sedeRes.json();

            setUsers(userData);
            setRoles(roleData);
            setSedes(sedeData);
        } catch (error) {
            console.error('Error fetching users data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                nombre: user.nombre,
                email: user.email,
                password: '', // Password stays empty unless changing
                role_id: user.role_id,
                sede_id: user.sede_id,
                status: user.status
            });
        } else {
            setEditingUser(null);
            setFormData({
                nombre: '',
                email: '',
                password: '',
                role_id: roles.length > 0 ? roles[0].id : '',
                sede_id: sedes.length > 0 ? sedes[0].id : '',
                status: 1
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;
        const method = editingUser ? 'PUT' : 'POST';

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
                alert(data.error || 'Error al guardar usuario');
            }
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                const token = localStorage.getItem('pos_token');
                const res = await fetch(`${API_URL}/users/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    fetchData();
                } else {
                    const data = await res.json();
                    alert(data.error || 'No se pudo eliminar el usuario');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Gestión de Usuarios</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administra los accesos y perfiles del sistema</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
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
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Sede</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando usuarios...</td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No se encontraron usuarios</td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <UserIcon size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{user.nombre}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                            <Shield size={14} className="text-blue-500" />
                                            {user.role_name}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            <MapPin size={14} />
                                            {user.sede_name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.status == 1 ? 'badge-emerald' : 'badge-rose'}`}>
                                            {user.status == 1 ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleOpenModal(user)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.4rem' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
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
                            style={{ maxWidth: '600px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="font-heading">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="input-group">
                                        <label className="input-label">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                                            placeholder="Ej: Juan Pérez"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                required
                                                className="input-field"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                                                placeholder="usuario@ejemplo.com"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">
                                                {editingUser ? 'Contraseña (Dejar vacío para no cambiar)' : 'Contraseña'}
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="password"
                                                    required={!editingUser}
                                                    className="input-field"
                                                    style={{ paddingLeft: '2.5rem' }}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Rol / Perfil</label>
                                            <select
                                                required
                                                className="input-field"
                                                value={formData.role_id}
                                                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                            >
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Sede Asignada</label>
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
                                    <div className="input-group" style={{ marginTop: '1rem' }}>
                                        <label className="input-label">Estado</label>
                                        <select
                                            className="input-field"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value={1}>Activo</option>
                                            <option value={0}>Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
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

export default Users;
