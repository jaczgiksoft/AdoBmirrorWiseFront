// utils/apiBase.js

// ⚙️ Usa process.env, porque Vite las definió ahí en vite.config.js
const apiUrl = process.env.VITE_API_URL || "http://localhost:4545/api";

// 🔹 URL completa del backend (con /api al final)
export const API_URL = apiUrl;

// 🔹 Base sin /api → útil para servir archivos (ej: imágenes o descargas)
export const API_BASE = apiUrl.replace(/\/api$/, ""); // → http://localhost:3000
