import React, { useState, useEffect } from 'react';
import { Shield, Save, CheckCircle, Info, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Permissions = () => {
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [rolePermissions, setRolePermissions] = useState([]); // Array of {module_id, permission_id}
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const API_URL = 'http://localhost/newpos/api/public/roles';

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('pos_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [rolesRes, modulesRes, permRes] = await Promise.all([
                fetch(API_URL, { headers }),
                fetch(`${API_URL}/modules`, { headers }),
                fetch(`${API_URL}/permissions`, { headers })
            ]);

            const rolesData = await rolesRes.json();
            const modulesData = await modulesRes.json();
            const permData = await permRes.json();

            setRoles(rolesData);
            setModules(modulesData);
            setPermissions(permData);

            if (rolesData.length > 0) {
                handleSelectRole(rolesData[0].id);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = async (roleId) => {
        setSelectedRole(roleId);
        setLoading(true);
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/${roleId}/permissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRolePermissions(data); // Expecting array of {module_id, permission_id}
        } catch (error) {
            console.error('Error fetching role permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const isChecked = (moduleId, permissionId) => {
        return rolePermissions.some(rp => rp.module_id == moduleId && rp.permission_id == permissionId);
    };

    const handleToggle = (moduleId, permissionId) => {
        setRolePermissions(prev => {
            const exists = prev.some(rp => rp.module_id == moduleId && rp.permission_id == permissionId);
            if (exists) {
                return prev.filter(rp => !(rp.module_id == moduleId && rp.permission_id == permissionId));
            } else {
                return [...prev, { module_id: moduleId, permission_id: permissionId }];
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('pos_token');
            const res = await fetch(`${API_URL}/${selectedRole}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ permissions: rolePermissions })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Permisos guardados con éxito' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                alert('Error al guardar permisos');
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading && roles.length === 0) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando matriz de permisos...</div>;
    }

    return (
        <div className="component-fade-in">
            <div className="flex-between">
                <div>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', mb: '0.25rem' }}>Matriz de Permisos</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Define qué puede hacer cada rol en los diferentes módulos</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', marginTop: '2rem' }}>
                {/* Roles Sidebar */}
                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
                    <h4 style={{ marginBottom: '1rem', padding: '0 0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roles de Usuario</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => handleSelectRole(role.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: selectedRole === role.id ? 'var(--primary)' : 'transparent',
                                    color: selectedRole === role.id ? 'white' : 'var(--text-main)',
                                    fontWeight: selectedRole === role.id ? 600 : 500
                                }}
                            >
                                <Shield size={18} />
                                {role.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="table-container">
                    <div className="table-header flex-between" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                            <Info size={16} />
                            <span style={{ fontSize: '0.85rem' }}>Editando permisos para: <b>{roles.find(r => r.id === selectedRole)?.nombre}</b></span>
                        </div>
                        <button
                            className="btn btn-primary"
                            disabled={saving}
                            onClick={handleSave}
                        >
                            <Save size={18} />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Módulo</th>
                                {permissions.map(p => (
                                    <th key={p.id} style={{ textAlign: 'center', textTransform: 'capitalize' }}>{p.nombre}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map(module => (
                                <tr key={module.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></div>
                                            {module.nombre}
                                        </div>
                                    </td>
                                    {permissions.map(p => (
                                        <td key={p.id} style={{ textAlign: 'center' }}>
                                            <label className="checkbox-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked(module.id, p.id)}
                                                    onChange={() => handleToggle(module.id, p.id)}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                />
                                            </label>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {message && (
                        <div style={{
                            position: 'absolute',
                            bottom: '2rem',
                            right: '2rem',
                            background: '#10B981',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}>
                            <CheckCircle size={18} />
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Permissions;
