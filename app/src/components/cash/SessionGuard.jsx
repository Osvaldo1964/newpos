import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CashManager from './CashManager';
import { formatDate } from '../../utils/formatters';

/**
 * SessionGuard ensures that Cashiers (role_id: 3) have an active cash session
 * for the current day.
 * 
 * Rules:
 * 1. No active session -> Show forced opening modal.
 * 2. Active session from previous day -> Show forced closing modal, then force opening.
 * 3. Active session from today -> Allow access.
 */
const SessionGuard = ({ user, activeSession, onSessionStatusChange, children }) => {
    const [status, setStatus] = useState('CHECKING'); // CHECKING, LOCKED_OPEN, LOCKED_CLOSE, OK
    const [loading, setLoading] = useState(true);

    const isCashier = user?.role_id === 3;

    useEffect(() => {
        if (!isCashier) {
            setStatus('OK');
            setLoading(false);
            return;
        }

        checkSessionIntegrity();
    }, [activeSession, user]);

    const checkSessionIntegrity = () => {
        setLoading(true);

        if (!activeSession) {
            setStatus('LOCKED_OPEN');
            setLoading(false);
            return;
        }

        // Check date
        const today = new Date().toISOString().split('T')[0];
        const sessionDate = new Date(activeSession.fecha_apertura).toISOString().split('T')[0];

        if (sessionDate !== today) {
            setStatus('LOCKED_CLOSE');
        } else {
            setStatus('OK');
        }
        setLoading(false);
    };

    const handleSuccess = () => {
        // Show loading while parent re-fetches the session.
        // DO NOT set status to 'OK' here — let checkSessionIntegrity() decide
        // the correct next state (LOCKED_OPEN for new-day opening, or OK if already open).
        setLoading(true);
        onSessionStatusChange(); // Trigger re-fetch in parent (App.jsx)
    };

    if (loading || status === 'CHECKING') {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw className="animate-spin" size={32} color="var(--primary)" />
            </div>
        );
    }

    if (status === 'OK') {
        return children;
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    padding: '2.5rem',
                    borderRadius: 'var(--radius-xl)',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xl)'
                }}
            >
                {status === 'LOCKED_OPEN' && (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <LogIn size={40} />
                        </div>
                        <h2 className="font-heading" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Apertura de Turno Obligatoria</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Hola <b>{user.nombre}</b>. Para poder utilizar el sistema, debes iniciar un turno de caja para el día de hoy.
                        </p>
                        <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                            <CashManager mode="apertura" onSessionStarted={handleSuccess} />
                        </div>
                    </>
                )}

                {status === 'LOCKED_CLOSE' && (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--rose-light)', color: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <AlertCircle size={40} />
                        </div>
                        <h2 className="font-heading" style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--rose)' }}>Turno Pendiente de Cierre</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Tienes una sesión de caja abierta desde el día <b>{formatDate(activeSession.fecha_apertura)}</b>.
                            Debes cerrar ese turno y realizar el arqueo antes de iniciar el nuevo día.
                        </p>
                        <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                            <CashManager mode="apertura" onSessionClosed={handleSuccess} />
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default SessionGuard;
