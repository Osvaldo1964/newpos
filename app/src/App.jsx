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
  Calculator,
  Tag,
  Shield,
  Users as UsersIcon,
  Monitor,
  History,
  FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'
import Items from './components/inventory/Items'
import Categories from './components/inventory/Categories'
import Warehouses from './components/inventory/Warehouses'
import PurchaseOrders from './components/inventory/PurchaseOrders'
import WarehouseEntries from './components/inventory/WarehouseEntries'
import StockTransfers from './components/inventory/StockTransfers'
import Sedes from './components/config/Sedes'
import Users from './components/config/Users'
import Permissions from './components/config/Permissions'
import CashRegisters from './components/config/CashRegisters'
import CashConcepts from './components/config/CashConcepts'
import CashManager from './components/cash/CashManager'
import CashAudit from './components/cash/CashAudit'
import SessionGuard from './components/cash/SessionGuard'
import Terceros from './components/contacts/Terceros'
import POS from './components/sales/POS'

const modules = [
  {
    id: 'inventarios',
    title: 'Inventarios',
    description: 'Gestión de productos, bodegas y traslados.',
    icon: <Package size={32} />,
    color: '#10B981',
    submodules: [
      { id: 'categorias', title: 'Categorías', icon: <Tag size={20} /> },
      { id: 'items', title: 'Items', icon: <ShoppingBag size={20} /> },
      { id: 'bodegas', title: 'Bodegas', icon: <Package size={20} /> },
      { id: 'compras_ordenes', title: 'Órdenes de Compra', icon: <FileText size={20} /> },
      { id: 'compras_entradas', title: 'Entradas a Bodega', icon: <ShoppingBag size={20} /> },
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
      { id: 'apertura', title: 'Apertura / Cierre', icon: <Banknote size={20} /> },
      { id: 'movimientos', title: 'Ingresos / Gastos', icon: <ArrowRightLeft size={20} /> },
      { id: 'auditoria', title: 'Auditoría', icon: <History size={20} /> },
      { id: 'cajas_master', title: 'Gestión de Cajas', icon: <Monitor size={20} /> },
      { id: 'conceptos', title: 'Conceptos Caja', icon: <Tag size={20} /> }
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
      { id: 'usuarios', title: 'Usuarios', icon: <UsersIcon size={20} /> },
      { id: 'terceros', title: 'Terceros', icon: <UsersIcon size={20} /> },
      { id: 'permisos', title: 'Permisos', icon: <Shield size={20} /> },
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
  const [activeSubmodule, setActiveSubmodule] = useState(null)
  const [activeSession, setActiveSession] = useState(null)

  const API_CASH = 'http://localhost/newpos/api/public/cash'

  React.useEffect(() => {
    if (user) {
      fetchActiveSession();
    }
  }, [user]);

  const fetchActiveSession = async () => {
    try {
      const token = localStorage.getItem('pos_token');
      if (!token) return;

      const res = await fetch(`${API_CASH}/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
      }
    } catch (error) {
      console.error('Error fetching active session:', error);
    }
  }

  // Token Expiration Checker
  React.useEffect(() => {
    if (!user) return;

    const checkToken = () => {
      const token = localStorage.getItem('pos_token');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp < now) {
          handleLogout();
          alert('Tu sesión ha expirado por inactividad.');
        }
      } catch (e) {
        console.error('Error parsing token');
      }
    };

    const interval = setInterval(checkToken, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    setUser(null)
    setActiveModule(null)
    setActiveSubmodule(null)
  }

  const handleBackToDashboard = () => {
    setActiveModule(null)
    setActiveSubmodule(null)
  }

  const handleBackToModule = () => {
    setActiveSubmodule(null)
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

  // Render Submodule Content
  const renderSubmodule = () => {
    switch (activeSubmodule) {
      case 'categorias':
        return <Categories />
      case 'items':
        return <Items />
      case 'bodegas':
        return <Warehouses />
      case 'sedes':
        return <Sedes />
      case 'usuarios':
        return <Users />
      case 'terceros':
        return <Terceros />
      case 'permisos':
        return <Permissions />
      case 'cajas_master':
        return <CashRegisters />
      case 'conceptos':
        return <CashConcepts />
      case 'apertura':
      case 'movimientos':
        return <CashManager mode={activeSubmodule} />
      case 'auditoria':
        return <CashAudit />
      case 'compras_ordenes':
        return <PurchaseOrders />
      case 'compras_entradas':
        return <WarehouseEntries />
      case 'traslados':
        return <StockTransfers />
      case 'pos':
        return <POS />
      default:
        return (
          <div className="cards-grid">
            {activeModule.submodules.map((sm) => (
              <motion.div
                key={sm.id}
                whileHover={{ y: -5 }}
                className="module-card glass"
                style={{ borderLeft: `4px solid ${activeModule.color}` }}
                onClick={() => setActiveSubmodule(sm.id)}
              >
                <div className="icon-wrapper" style={{ backgroundColor: `${activeModule.color}15`, color: activeModule.color }}>
                  {sm.icon}
                </div>
                <h3>{sm.title}</h3>
              </motion.div>
            ))}
          </div>
        )
    }
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
          {activeSubmodule ? activeModule.submodules.find(sm => sm.id === activeSubmodule)?.title : activeModule ? activeModule.title : 'Sistema POS Antigravity'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {activeModule ? (activeSubmodule ? `Gestión de ${activeSubmodule}` : activeModule.description) : 'Selecciona un módulo para comenzar'}
        </motion.p>
      </header>

      <AnimatePresence mode="wait">
        <SessionGuard
          user={user}
          activeSession={activeSession}
          onSessionStatusChange={fetchActiveSession}
        >
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
              key="active-module-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={handleBackToDashboard}
                  className="btn btn-ghost"
                >
                  ← Dashboard
                </button>
                {activeSubmodule && (
                  <button
                    onClick={handleBackToModule}
                    className="btn btn-ghost"
                  >
                    ← Volver a {activeModule.title}
                  </button>
                )}
              </div>

              {renderSubmodule()}
            </motion.div>
          )}
        </SessionGuard>
      </AnimatePresence>
    </div>
  )
}

export default App
