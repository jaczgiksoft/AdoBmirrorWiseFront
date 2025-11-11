import axios from "axios";
import { API_URL } from "@/utils/apiBase";

// Instancia base de Axios
const api = axios.create({
    baseURL: API_URL, // ✅ toma el valor dinámicamente desde .env
    timeout: 10000,
});

// 🔹 Interceptor: agrega token y maneja Content-Type dinámico
let tokenLogged = false;

api.interceptors.request.use(async (config) => {
    try {
        // 🧠 Si el cuerpo es FormData, dejamos que Axios configure el Content-Type
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        } else {
            // 🔒 Para requests normales (JSON)
            config.headers["Content-Type"] = "application/json";
        }

        // 🔑 Agrega token desde Keytar (manejador seguro en preload)
        const token = await window.electronAPI.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            if (!tokenLogged && import.meta.env.MODE === "development") {
                console.log("📦 Token enviado:", token.substring(0, 20) + "...");
                console.log("📦 Modo:", import.meta.env.MODE);
                tokenLogged = true;
            }
        } else if (window.location.pathname !== "/login") {
            console.warn("⚠️ No se encontró token en Keytar");
        }
    } catch (err) {
        console.error("⚠️ Error al configurar petición:", err);
    }

    return config;
});

// 🔹 Interceptor: maneja respuestas 401 (token inválido o expirado)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn("🔒 Token inválido o expirado. Limpiando sesión...");
            await window.electronAPI.clearToken();
        }
        return Promise.reject(error);
    }
);

export default api;
