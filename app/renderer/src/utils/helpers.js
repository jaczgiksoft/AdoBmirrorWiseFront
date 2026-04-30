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

/**
 * Genera un par de colores armónicos (fondo y texto)
 * para mantener contraste y estética consistente.
 *
 * @param {number} [saturationBg=45] Saturación del fondo (0–100)
 * @param {number} [lightnessBg=20] Luminosidad del fondo (0–100)
 * @param {number} [saturationText=80] Saturación del texto (0–100)
 * @param {number} [lightnessText=70] Luminosidad del texto (0–100)
 * @returns {{ bg: string, color: string }}
 */
export function generateHarmoniousColor(
    saturationBg = 45,
    lightnessBg = 20,
    saturationText = 80,
    lightnessText = 70
) {
    // Hue aleatorio (0–360)
    const hue = Math.floor(Math.random() * 360);

    return {
        bg: `hsl(${hue}, ${saturationBg}%, ${lightnessBg}%)`,
        color: `hsl(${hue}, ${saturationText}%, ${lightnessText}%)`,
    };
}

/**
 * Genera un par de colores armónicos (fondo y texto)
 * muy cercanos al color #10b981 (verde esmeralda),
 * con ligeras variaciones en saturación y luminosidad.
 *
 * @param {number} [saturationBg=80] Saturación del fondo (0–100)
 * @param {number} [lightnessBg=48] Luminosidad del fondo (0–100)
 * @param {number} [saturationText=95] Saturación del texto (0–100)
 * @param {number} [lightnessText=92] Luminosidad del texto (0–100)
 * @returns {{ bg: string, color: string }}
 */
export function generateHarmoniousGreen(
    saturationBg = 80,
    lightnessBg = 48,
    saturationText = 95,
    lightnessText = 92
) {
    // 🎨 Hue base del color #10b981 ≈ 160°
    const baseHue = 160;

    // Variación leve para no salir de la gama verde (±5°)
    const hueSpread = 5;

    const hue = baseHue - hueSpread + Math.floor(Math.random() * (hueSpread * 2 + 1));

    return {
        bg: `hsl(${hue}, ${saturationBg}%, ${lightnessBg}%)`,
        color: `hsl(${hue}, ${saturationText}%, ${lightnessText}%)`,
    };
}
/**
 * Genera un par de colores armónicos (fondo y texto)
 * muy cercanos al color #00bfff (azul/cyan brillante),
 * con ligeras variaciones en saturación y luminosidad.
 *
 * @param {number} [saturationBg=75] Saturación del fondo (0–100)
 * @param {number} [lightnessBg=50] Luminosidad del fondo (0–100)
 * @param {number} [saturationText=95] Saturación del texto (0–100)
 * @param {number} [lightnessText=92] Luminosidad del texto (0–100)
 * @returns {{ bg: string, color: string }}
 */
export function generateHarmoniousBlue(
    saturationBg = 75,
    lightnessBg = 50,
    saturationText = 95,
    lightnessText = 92
) {
    // 🎨 Hue base del color #00bfff ≈ 195°
    const baseHue = 195;

    // Variación leve para no salir de la gama azul (±5°)
    const hueSpread = 5;

    const hue = baseHue - hueSpread + Math.floor(Math.random() * (hueSpread * 2 + 1));

    return {
        bg: `hsl(${hue}, ${saturationBg}%, ${lightnessBg}%)`,
        color: `hsl(${hue}, ${saturationText}%, ${lightnessText}%)`,
    };
}
/**
 * Devuelve un color de texto (blanco o negro) legible según el color de fondo.
 * @param {string} hexColor
 * @returns {string}
 */
export function getContrastColor(hexColor) {
    if (!hexColor) return "#fff";
    const c = hexColor.replace("#", "");
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    // Algoritmo de luminancia perceptual
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#000" : "#fff";
}

/**
 * Genera un color hexadecimal aleatorio
 * @returns {string}
 */
export function getRandomHexColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0").toUpperCase();
}
