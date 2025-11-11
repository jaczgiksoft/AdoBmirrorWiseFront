// src/store/useAuthStore.js
import { create } from "zustand";
import { fetchCurrentUser, logoutFromAPI } from "@/services/auth.service";

const SPLASH_DURATION = parseInt(import.meta.env.VITE_SPLASH_TIME || "2000", 10);
let warnedNoToken = false; // ⚠️ evita logs duplicados
let showingSplash = false; // ⚙️ evita mostrar doble splash en logout

export const useAuthStore = create((set) => ({
    user: null,
    currentStore: null,
    currentRegister: null, // 🧾 Caja activa (asociada al equipo)
    currentSession: null, // 💰 Sesión de caja activa
    isAuthenticated: false,
    loading: false,
    statusMessage: "Inicializando...", // 👈 usado por SplashScreen

    /**
     * 🔹 Inicializa o restaura la sesión si existe un token válido en Keytar
     */
    initSession: async () => {
        try {
            set({ loading: true, statusMessage: "Verificando sesión..." });

            // 🔑 Verifica si hay token en Keytar
            const token = await window.electronAPI.getToken();
            if (!token) {
                if (!warnedNoToken && import.meta.env.MODE === "development") {
                    console.warn("⚠️ No hay token almacenado. No se verificará sesión.");
                    warnedNoToken = true;
                }
                set({ user: null, isAuthenticated: false, loading: false });
                return null;
            }

            // 👤 Cargar datos del usuario autenticado
            const userData = await fetchCurrentUser();
            console.log("User: ", userData)
            if (!userData?.id) {
                console.warn("⚠️ Usuario inválido o sin datos de perfil.");
                set({ user: null, isAuthenticated: false, loading: false });
                return null;
            }

            set({ user: userData, isAuthenticated: true });

            // 🔹 Restaura entidades locales
            const restore = (key) => {
                const raw = localStorage.getItem(key);
                if (!raw) return null;
                try {
                    return JSON.parse(raw);
                } catch {
                    console.warn(`⚠️ Error leyendo ${key} almacenado, limpiando...`);
                    localStorage.removeItem(key);
                    return null;
                }
            };

            const store = restore("currentStore");
            const register = restore("currentRegister");
            const session = restore("currentSession");

            if (store) set({ currentStore: store });
            if (register) set({ currentRegister: register });
            if (session) set({ currentSession: session });

            return userData;
        } catch (err) {
            if (err.response?.status === 401) {
                console.log("🔒 Sesión expirada o token inválido.");
            } else {
                console.error("❌ Error cargando sesión:", err.message);
            }
            set({ user: null, isAuthenticated: false });
            return null;
        } finally {
            set({ loading: false });
        }
    },

    /**
     * 🔹 Establece manualmente los datos del usuario después del login
     */
    setSession: (userData) => set({ user: userData, isAuthenticated: true }),

    /**
     * 🔹 Limpia el token y el estado global de autenticación
     */
    logout: async () => {
        if (showingSplash) return; // evita duplicación
        showingSplash = true;

        set({
            statusMessage: "Cerrando sesión...",
            loading: true,
        });

        try {
            await logoutFromAPI();
            await window.electronAPI.clearToken();
            await new Promise((r) => setTimeout(r, SPLASH_DURATION));
            console.log("👋 Sesión cerrada correctamente.");
        } catch (error) {
            console.error("❌ Error al cerrar sesión:", error);
        } finally {
            showingSplash = false;

            // 🧹 Limpieza total de sesión
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
                currentStore: null,
                currentRegister: null,
                currentSession: null,
                statusMessage: "Inicializando...",
            });

            localStorage.removeItem("currentStore");
            localStorage.removeItem("currentRegister");
            localStorage.removeItem("currentSession");
        }
    },

    /**
     * 🔹 Establece la sucursal activa y la persiste localmente
     */
    setCurrentStore: (store) => {
        set({ currentStore: store });
        localStorage.setItem("currentStore", JSON.stringify(store));
    },

    /**
     * 🔹 Establece la caja activa y la persiste localmente
     */
    setCurrentRegister: (register) => {
        set({ currentRegister: register });
        localStorage.setItem("currentRegister", JSON.stringify(register));
    },

    /**
     * 🔹 Establece la sesión de caja activa y la persiste localmente
     */
    setCurrentSession: (session) => {
        set({ currentSession: session });
        localStorage.setItem("currentSession", JSON.stringify(session));
    },

    /**
     * 🔹 Limpia solo la sesión de caja (mantiene usuario logueado)
     */
    clearCashSession: () => {
        set({ currentSession: null });
        localStorage.removeItem("currentSession");
    },

    /**
     * 🔹 Restaura la sucursal almacenada al iniciar sesión
     */
    loadStoredStore: () => {
        const saved = localStorage.getItem("currentStore");
        if (saved) {
            try {
                const store = JSON.parse(saved);
                set({ currentStore: store });
                return store;
            } catch (e) {
                console.warn("⚠️ Error leyendo currentStore almacenada:", e);
                localStorage.removeItem("currentStore");
            }
        }
        return null;
    },

    /**
     * 🔹 Restaura la caja almacenada
     */
    loadStoredRegister: () => {
        const saved = localStorage.getItem("currentRegister");
        if (saved) {
            try {
                const register = JSON.parse(saved);
                set({ currentRegister: register });
                return register;
            } catch (e) {
                console.warn("⚠️ Error leyendo currentRegister:", e);
                localStorage.removeItem("currentRegister");
            }
        }
        return null;
    },

    /**
     * 🔹 Restaura la sesión de caja almacenada
     */
    loadStoredSession: () => {
        const saved = localStorage.getItem("currentSession");
        if (saved) {
            try {
                const session = JSON.parse(saved);
                set({ currentSession: session });
                return session;
            } catch (e) {
                console.warn("⚠️ Error leyendo currentSession:", e);
                localStorage.removeItem("currentSession");
            }
        }
        return null;
    },
}));
