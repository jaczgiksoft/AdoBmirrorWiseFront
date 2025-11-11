// src/utils/helpers.js

/**
 * Genera una contraseña aleatoria segura
 * @param {number} length - Longitud de la contraseña (default: 10)
 * @returns {string}
 */
export function generatePassword(length = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (x) => chars[x % chars.length]).join("");
}

/**
 * Evalúa la fuerza de una contraseña (0–4)
 * @param {string} password
 * @returns {number}
 */
export function getPasswordStrength(password) {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

/**
 * Formatea un teléfono mexicano (+52 o 10 dígitos)
 * @param {string} phone
 * @returns {string}
 */
export function formatPhoneMX(phone = "") {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("52") && digits.length > 10) {
        return `+${digits}`;
    }
    return `+52${digits}`;
}

/**
 * Valida un teléfono MX
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhoneMX(phone = "") {
    return /^\+?52?\d{10}$/.test(phone.replace(/\s+/g, ""));
}

/**
 * Crea automáticamente un username tipo "nombre.apellido"
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
export function generateUsername(firstName, lastName) {
    if (!firstName || !lastName) return "";
    return `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, "");
}

/**
 * Devuelve el nombre completo formateado
 * @param {object} user
 * @returns {string}
 */
export function getFullName(user = {}) {
    return [user.first_name, user.last_name, user.second_last_name]
        .filter(Boolean)
        .join(" ");
}

/**
 * Debounce: retrasa la ejecución de una función
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} str
 * @returns {string}
 */
export function capitalizeWords(str = "") {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convierte un archivo a Base64
 * (útil si el backend espera la imagen embebida)
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
