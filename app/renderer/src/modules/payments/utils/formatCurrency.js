/**
 * utils/formatCurrency.js
 * 
 * Estadarización global de formato de moneda para México.
 * Privado al módulo de pagos.
 *
 * @param {number|null|undefined} value
 * @returns {string} e.g. "$1,234.56"
 */
const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return formatter.format(0);
    }
    return formatter.format(value);
}
