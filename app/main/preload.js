// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// 🔒 Lista blanca de canales seguros (solo estos nombres pueden invocarse)
const validChannels = [
    "auth:save-token",
    "auth:get-token",
    "auth:clear-token",
    "auth:debug-token",
    "app:exit",
    "ping",
    "app:open-settings",
    "shortcut:save",
    "system:get-pcname",
    "app:open-kiosk",
    "app:update-available",
    "app:download-update"
];

contextBridge.exposeInMainWorld("electronAPI", {
    /**
     * 🔐 Auth — manejo seguro del token
     */
    saveToken: (token) => ipcRenderer.invoke("auth:save-token", token),
    getToken: () => ipcRenderer.invoke("auth:get-token"),
    clearToken: () => ipcRenderer.invoke("auth:clear-token"),
    debugToken: () => ipcRenderer.invoke("auth:debug-token"),

    /**
     * ⚙️ Aplicación
     */
    exitApp: () => ipcRenderer.invoke("app:exit"),
    openKiosk: () => ipcRenderer.invoke("app:open-kiosk"),

    /**
     * 🧩 Utilidades
     */
    ping: () => ipcRenderer.invoke("ping"),

    /**
     * 🧠 Listener seguro (solo canales aprobados)
     */
    on(channel, callback) {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_event, ...args) => callback(...args));
        } else {
            console.warn(`❌ Canal IPC no autorizado: ${channel}`);
        }
    },

    /**
     * 💾 Nuevo: escucha el atajo F5 (shortcut:save)
     */
    onSaveShortcut(callback) {
        const channel = "shortcut:save";

        // 🔒 Prevención: eliminamos cualquier listener previo
        ipcRenderer.removeAllListeners(channel);

        if (typeof callback === "function") {
            const wrapped = (_event, ...args) => callback(...args);
            ipcRenderer.on(channel, wrapped);
        }
    },

    /**
     * 🖥️ Información del sistema — obtener nombre del equipo
     */
    getPcName: async () => ipcRenderer.invoke("system:get-pcname"),
    checkUpdate: () => ipcRenderer.invoke("app:check-update"),
    downloadUpdate: () => ipcRenderer.invoke("app:download-update"),
});
