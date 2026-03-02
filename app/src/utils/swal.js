/**
 * swal.js — Centralized SweetAlert2 helper for the POS system
 *
 * Usage:
 *   import { toast, confirmDialog, errorAlert, successAlert, infoAlert } from '../../utils/swal';
 */
import Swal from 'sweetalert2';

const baseConfig = {
    customClass: {
        popup: 'swal-popup',
        confirmButton: 'swal-btn-confirm',
        cancelButton: 'swal-btn-cancel',
    },
    buttonsStyling: false,
    reverseButtons: true,
};

/** Quick top-right toast (non-blocking) */
export const toast = (msg, icon = 'success') =>
    Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        ...baseConfig,
    }).fire({ icon, title: msg });

/** Error dialog */
export const errorAlert = (msg, title = 'Error') =>
    Swal.fire({ ...baseConfig, icon: 'error', title, text: msg });

/** Success dialog */
export const successAlert = (msg, title = '¡Listo!') =>
    Swal.fire({ ...baseConfig, icon: 'success', title, text: msg, timer: 2000, showConfirmButton: false });

/** Info / warning dialog */
export const infoAlert = (msg, title = 'Atención') =>
    Swal.fire({ ...baseConfig, icon: 'warning', title, text: msg });

/**
 * Confirmation dialog — returns true if user clicks Confirm.
 * Usage:  if (!(await confirmDialog('¿Eliminar?'))) return;
 */
export const confirmDialog = (text, title = '¿Estás seguro?', confirmText = 'Sí, continuar') =>
    Swal.fire({
        ...baseConfig,
        icon: 'warning',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar',
    }).then(r => r.isConfirmed);
