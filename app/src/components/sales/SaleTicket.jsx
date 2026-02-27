import React, { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';

const METODO_LABEL = {
    EFECTIVO: 'Efectivo',
    TARJETA: 'Tarjeta Débito/Crédito',
    TRANSFERENCIA: 'Transferencia / QR',
};

const SaleTicket = ({ saleData, onClose }) => {
    const ticketRef = useRef(null);

    const {
        saleId, fecha, cajero, customer,
        warehouse, items, subtotal, ivaTotal, total, payments, cambio
    } = saleData;

    const handlePrint = () => {
        const printContents = ticketRef.current.innerHTML;
        const w = window.open('', '_blank', 'width=400,height=700');
        w.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8"/>
                <title>Ticket #${saleId}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        color: #111;
                        background: #fff;
                        padding: 8px;
                        width: 80mm;
                    }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { font-weight: bold; }
                    .separator { border-top: 1px dashed #555; margin: 6px 0; }
                    .row { display: flex; justify-content: space-between; margin: 2px 0; }
                    .total-row { font-size: 16px; font-weight: bold; }
                    .logo { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
                    table { width: 100%; border-collapse: collapse; }
                    td { padding: 3px 0; vertical-align: top; }
                    td.price { text-align: right; white-space: nowrap; }
                    .footer { text-align: center; margin-top: 12px; font-size: 11px; color: #555; }
                </style>
            </head>
            <body>
                ${printContents}
                <script>window.onload = function(){ window.print(); window.close(); }<\/script>
            </body>
            </html>
        `);
        w.document.close();
    };

    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="modal-content"
                style={{ maxWidth: '480px' }}
            >
                {/* Modal Header */}
                <div className="modal-header">
                    <h3 className="font-heading">Ticket de Venta</h3>
                    <button onClick={onClose} className="btn-action"><X size={20} /></button>
                </div>

                {/* Ticket Preview */}
                <div className="modal-body" style={{ padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '12px', maxHeight: '65vh', overflowY: 'auto' }}>
                    <div ref={ticketRef} style={{ fontFamily: "'Courier New', monospace", fontSize: '13px', color: '#111', maxWidth: '340px', margin: '0 auto', lineHeight: 1.5 }}>

                        {/* Encabezado */}
                        <div className="center" style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <div className="logo bold" style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '3px' }}>NewPOS</div>
                            <div style={{ fontSize: '11px', marginTop: '2px' }}>Sistema Punto de Venta</div>
                        </div>

                        <div className="separator" style={{ borderTop: '1px dashed #888', margin: '8px 0' }} />

                        {/* Datos de la venta */}
                        <div style={{ marginBottom: '6px' }}>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Ticket #:</span><span className="bold">{String(saleId).padStart(6, '0')}</span>
                            </div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Fecha:</span><span>{fecha}</span>
                            </div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Cajero:</span><span>{cajero}</span>
                            </div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Cliente:</span><span>{customer || 'Público General'}</span>
                            </div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Bodega:</span><span>{warehouse}</span>
                            </div>
                        </div>

                        <div className="separator" style={{ borderTop: '1px dashed #888', margin: '8px 0' }} />

                        {/* Ítems */}
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <td style={{ paddingBottom: '4px', fontWeight: 'bold' }}>Producto</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>Cant</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Subtotal</td>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ verticalAlign: 'top', paddingRight: '4px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{item.nombre}</div>
                                            <div style={{ fontSize: '11px', color: '#555' }}>
                                                {item.sku} · {formatCurrency(item.precio_unitario)} c/u
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', verticalAlign: 'top' }}>{item.cantidad}</td>
                                        <td style={{ textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                            {formatCurrency(item.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="separator" style={{ borderTop: '1px dashed #888', margin: '8px 0' }} />

                        {/* Totales */}
                        <div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Subtotal:</span><span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>IVA:</span><span>{formatCurrency(ivaTotal)}</span>
                            </div>
                        </div>

                        <div className="separator" style={{ borderTop: '2px solid #111', margin: '8px 0' }} />

                        <div className="row total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900 }}>
                            <span>TOTAL:</span><span>{formatCurrency(total)}</span>
                        </div>

                        <div className="separator" style={{ borderTop: '1px dashed #888', margin: '8px 0' }} />

                        {/* Medios de pago */}
                        <div style={{ marginBottom: '6px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Forma de Pago:</div>
                            {payments.map((p, i) => (
                                <div key={i} className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{METODO_LABEL[p.metodo] || p.metodo}{p.referencia ? ` (${p.referencia})` : ''}</span>
                                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(p.monto)}</span>
                                </div>
                            ))}
                            {cambio > 0 && (
                                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontWeight: 900, fontSize: '14px', color: '#166534', borderTop: '1px solid #86EFAC', paddingTop: '4px' }}>
                                    <span>CAMBIO / VUELTAS:</span>
                                    <span>{formatCurrency(cambio)}</span>
                                </div>
                            )}
                        </div>

                        <div className="separator" style={{ borderTop: '1px dashed #888', margin: '8px 0' }} />

                        {/* Pie */}
                        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#555' }}>
                            <div>¡Gracias por su compra!</div>
                            <div style={{ marginTop: '4px' }}>Conserve este ticket como comprobante.</div>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="modal-footer" style={{ gap: '1rem' }}>
                    <button className="btn btn-ghost" onClick={onClose}>
                        <X size={16} /> Cerrar
                    </button>
                    <button className="btn btn-primary" onClick={handlePrint} style={{ flex: 1 }}>
                        <Printer size={18} /> Imprimir Ticket
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default SaleTicket;
