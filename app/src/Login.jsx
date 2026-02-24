import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react'

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('admin@pos.com')
    const [password, setPassword] = useState('admin123')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('http://localhost/newpos/api/public/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await response.json()

            if (response.ok) {
                localStorage.setItem('pos_token', data.token)
                localStorage.setItem('pos_user', JSON.stringify(data.user))
                onLoginSuccess(data.user)
            } else {
                setError(data.error || 'Error al iniciar sesión')
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="module-card glass"
                style={{ width: '100%', maxWidth: '400px', textAlign: 'left', padding: '2.5rem' }}
            >
                <div className="icon-wrapper" style={{ margin: '0 0 1.5rem 0' }}>
                    <LogIn size={32} />
                </div>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Bienvenido</h2>
                <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Ingresa tus credenciales para continuar</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                            Correo Electrónico
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid #E2E8F0',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid #E2E8F0',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.85rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}

export default Login
