import React, { useState } from 'react'
import {
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Globe,
  Banknote,
  ArrowRightLeft,
  ShoppingBag,
  TrendingDown,
  LayoutDashboard,
  Calculator
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

const modules = [
  {
    id: 'inventarios',
    title: 'Inventarios',
    description: 'Gestión de productos, bodegas y traslados.',
    icon: <Package size={32} />,
    color: '#10B981',
    submodules: [
      { id: 'items', title: 'Items', icon: <ShoppingBag size={20} /> },
      { id: 'bodegas', title: 'Bodegas', icon: <Package size={20} /> },
      { id: 'traslados', title: 'Traslados', icon: <ArrowRightLeft size={20} /> },
      { id: 'ajustes', title: 'Ajustes', icon: <TrendingDown size={20} /> }
    ]
  },
  {
    id: 'ventas',
    title: 'Ventas',
    description: 'Punto de venta POS y gestión de promociones.',
    icon: <ShoppingCart size={32} />,
    color: '#1E3A8A',
    submodules: [
      { id: 'pos', title: 'POS Cajero', icon: <Calculator size={20} /> },
      { id: 'promociones', title: 'Promociones', icon: <TrendingDown size={20} /> }
    ]
  },
  {
    id: 'caja',
    title: 'Caja',
    description: 'Apertura, cierre y movimientos de efectivo.',
    icon: <Banknote size={32} />,
    color: '#064E3B',
    submodules: [
      { id: 'apertura', title: 'Apertura/Cierre', icon: <Banknote size={20} /> },
      { id: 'gastos', title: 'Gastos', icon: <TrendingDown size={20} /> }
    ]
  },
  {
    id: 'reportes',
    title: 'Reportes',
    description: 'Análisis de ventas por día y por sede.',
    icon: <BarChart3 size={32} />,
    color: '#64748B',
    submodules: [
      { id: 'dia', title: 'Ventas por Día', icon: <BarChart3 size={20} /> },
      { id: 'sede', title: 'Ventas por Sede', icon: <LayoutDashboard size={20} /> }
    ]
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    description: 'Tienda online pública y pedidos.',
    icon: <Globe size={32} />,
    color: '#10B981',
    submodules: [
      { id: 'catalogo', title: 'Catálogo', icon: <Package size={20} /> },
      { id: 'pedidos', title: 'Pedidos Online', icon: <ShoppingCart size={20} /> }
    ]
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    description: 'Parámetros del sistema y usuarios.',
    icon: <Settings size={32} />,
    color: '#1E3A8A',
    submodules: [
      { id: 'usuarios', title: 'Usuarios', icon: <Settings size={20} /> },
      { id: 'sedes', title: 'Sedes', icon: <LayoutDashboard size={20} /> }
    ]
  }
]

import Login from './Login'

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pos_user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [activeModule, setActiveModule] = useState(null)

  const handleLogout = () => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    setUser(null)
    setActiveModule(null)
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <div className="dashboard-container">
      <header className="header" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, textAlign: 'right' }}>
          <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>{user.nombre}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{user.role}</p>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#B91C1C',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: 0
            }}
          >
            Cerrar Sesión
          </button>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {activeModule ? activeModule.title : 'Sistema POS Antigravity'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {activeModule ? activeModule.description : 'Selecciona un módulo para comenzar'}
        </motion.p>
      </header>

      <AnimatePresence mode="wait">
        {!activeModule ? (
          <motion.div
            key="main-grid"
            className="cards-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {modules.map((m) => (
              <motion.div
                key={m.id}
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className="module-card"
                onClick={() => setActiveModule(m)}
              >
                <div className="icon-wrapper" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                  {m.icon}
                </div>
                <h3>{m.title}</h3>
                <p>{m.description}</p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="submodule-grid"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => setActiveModule(null)}
              style={{
                marginBottom: '1.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}
            >
              ← Volver al Dashboard
            </button>
            <div className="cards-grid">
              {activeModule.submodules.map((sm) => (
                <motion.div
                  key={sm.id}
                  whileHover={{ y: -5 }}
                  className="module-card glass"
                  style={{ borderLeft: `4px solid ${activeModule.color}` }}
                >
                  <div className="icon-wrapper" style={{ backgroundColor: `${activeModule.color}15`, color: activeModule.color }}>
                    {sm.icon}
                  </div>
                  <h3>{sm.title}</h3>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
