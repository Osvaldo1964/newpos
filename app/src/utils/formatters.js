/**
 * Colombian Regional Formatters
 */

/**
 * Formats a number as Colombian Pesos
 * Format: 1,234.56
 * @param {number|string} value 
 * @returns {string}
 */
export const formatCurrency = (value) => {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(amount)) return '$ 0.00';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD', // We use USD format patterns (comma thousands, dot decimal) as requested
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace('$', '$ ');
};

/**
 * Formats a date string to Colombian standard
 * @param {string} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).format(date);
};

/**
 * Strips formatting to get a clean number for processing
 * Removes commas and ensures a valid float
 * @param {string|number} value 
 * @returns {number}
 */
export const parseLocaleNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;

    // Remove commas (thousands separator), keep the dot (decimal separator)
    const cleanValue = value.toString().replace(/,/g, '');
    const parsed = parseFloat(cleanValue);

    return isNaN(parsed) ? 0 : parsed;
};
