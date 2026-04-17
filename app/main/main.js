// main.js
require("dotenv").config();
const { app, BrowserWindow, ipcMain, globalShortcut, shell } = require("electron");
const path = require("path");
const keytar = require("keytar");
const net = require("net");
const os = require("os");
const { initUpdater } = require("./updater");
const { checkForUpdates } = require("./updater/updater.service");

let mainWindow = null;
let kioskWindow = null;
let backendServer = null; // referencia global al servidor backend

/**
 * 🧠 Verifica si el puerto está disponible antes de iniciar el backend
 */
async function isPortAvailable(port) {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once("error", () => resolve(false))
            .once("listening", () => {
                tester.close();
                resolve(true);
            })
            .listen(port);
    });
}

/**
 * 🪟 Crea la ventana principal de Electron
 */
async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 700,
        fullscreen: true,
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const isDev = !app.isPackaged;
    const vitePort = process.env.VITE_PORT || 5173;
    const devURL = `http://localhost:${vitePort}`;
    const prodURL = `file://${path.join(__dirname, "../renderer/dist/index.html")}`;

    if (isDev) {
        console.log("🧩 Modo desarrollo activo");
        console.log(`🌐 Esperando a que Vite levante en ${devURL}...`);
        await waitForVite(devURL); // 👈 Espera activa
        mainWindow.loadURL(devURL);
    } else {
        console.log("📦 Modo producción activo");
        console.log(`📁 Cargando renderer empaquetado desde: ${prodURL}`);
        mainWindow.loadURL(prodURL);
    }

    // 🔒 Bloqueo de teclas y captura de F11
    mainWindow.webContents.on("before-input-event", (event, input) => {
        const key = String(input.key).toUpperCase();
        if (key === "F5" || (input.control && key === "R")) event.preventDefault();
        if (key === "F11") {
            event.preventDefault();
            console.log("⚙️ F11 presionado → abrir Configuración");
            mainWindow.webContents.send("app:open-settings");
        }
        if (input.control && input.shift && key === "R") {
            console.log("🔁 Recargando ventana sin caché...");
            event.preventDefault();
            mainWindow.webContents.reloadIgnoringCache();
        }
    });

    mainWindow.on("closed", () => (mainWindow = null));
}

/**
 * ⏳ Espera hasta que Vite esté disponible antes de cargar la ventana
 */
/**
 * ⏳ Espera hasta que el servidor Vite esté disponible antes de cargar la ventana
 */
async function waitForVite(url, retries = 30, delay = 500) {
    const http = require("http");

    for (let i = 0; i < retries; i++) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(url, (res) => {
                    if (res.statusCode === 200) resolve(true);
                    else reject(new Error(`HTTP ${res.statusCode}`));
                });
                req.on("error", reject);
                req.end();
            });
            console.log("✅ Vite está listo, cargando renderer...");
            return;
        } catch {
            console.log("⏳ Esperando a que Vite levante...");
            await new Promise((r) => setTimeout(r, delay));
        }
    }

    console.warn("⚠️ Vite no respondió a tiempo, intentando cargar de todos modos...");
}

/**
 * 🚀 Inicialización principal
 */

app.whenReady().then(async () => {
    const port = parseInt(process.env.VITE_API_PORT || "4545", 10);
    const available = await isPortAvailable(port);

    if (available) {
        try {
            backendServer = require("../../core/src/server");
            console.log(`🚀 Backend iniciado en http://localhost:${port}`);
        } catch (err) {
            console.error("❌ Error al iniciar el backend:", err);
        }
    } else {
        console.warn(`⚠️ Puerto ${port} ocupado. Saltando inicio del backend.`);
    }

    await createWindow();

    // 🚀 AQUÍ INICIAMOS EL CHECKEO
    initUpdater(mainWindow);

    globalShortcut.register("F5", () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) win.webContents.send("shortcut:save");
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 🧹 Limpieza al salir
app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});


/**
 * 🧹 Cierre limpio de backend y aplicación
 */
app.on("before-quit", () => {
    if (backendServer && backendServer.close) {
        console.log("🛑 Cerrando servidor backend...");
        backendServer.close(() => console.log("✅ Servidor Express detenido"));
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

/**
 * 🧨 Captura Ctrl+C o cierres forzados
 */
process.on("SIGINT", () => {
    console.log("🛑 Ctrl+C detectado, cerrando aplicación...");
    if (backendServer && backendServer.close) backendServer.close();
    app.quit();
});
process.on("SIGTERM", () => {
    console.log("🛑 Proceso terminado externamente...");
    if (backendServer && backendServer.close) backendServer.close();
    app.quit();
});

/**
 * 🔌 IPC — Comunicación segura entre Main y Renderer
 */
ipcMain.handle("ping", async () => "pong");

ipcMain.handle("app:check-update", async () => {
    console.log("📡 Renderer pidió check de update");
    return await checkForUpdates();
});

ipcMain.handle("app:download-update", async () => {
    try {
        console.log("⬇️ Descargando update...");

        const result = await checkForUpdates();

        if (result?.url) {
            await shell.openExternal(result.url);
            console.log("🚀 Abriendo instalador...");
        }

        return true;
    } catch (error) {
        console.error("❌ Error al descargar update:", error);
        return false;
    }
});

// 🔐 Token seguro con Keytar
ipcMain.handle("auth:save-token", async (_, token) => {
    await keytar.setPassword("BWISE", "auth_token", token);
    return true;
});
ipcMain.handle("auth:get-token", async () => {
    return await keytar.getPassword("BWISE", "auth_token");
});
ipcMain.handle("auth:clear-token", async () => {
    await keytar.deletePassword("BWISE", "auth_token");
    return true;
});
ipcMain.handle("auth:debug-token", async () => {
    const token = await keytar.getPassword("BWISE", "auth_token");
    console.log("🔍 Token actual:", token ? token.substring(0, 50) + "..." : "No existe");
    return token;
});
ipcMain.handle("system:get-pcname", async () => {
    try {
        return os.hostname();
    } catch {
        return "UNKNOWN-PC";
    }
});


ipcMain.handle("app:exit", async () => {
    console.log("🛑 Cierre solicitado desde renderer");
    app.quit();
});

// 📺 Kiosko de Auto-confirmación
ipcMain.handle("app:open-kiosk", async () => {
    if (kioskWindow && !kioskWindow.isDestroyed()) {
        kioskWindow.focus();
        return;
    }

    kioskWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 800,
        minHeight: 600,
        fullscreen: true,
        kiosk: true,
        autoHideMenuBar: true,
        frame: false, // Frame-less for kiosk feel
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const isDev = !app.isPackaged;
    const vitePort = process.env.VITE_PORT || 5173;
    const devURL = `http://localhost:${vitePort}`;

    if (isDev) {
        kioskWindow.loadURL(`${devURL}/kiosk`);
    } else {
        kioskWindow.loadFile(path.join(__dirname, "../renderer/dist/index.html"), { hash: "/kiosk" });
    }

    kioskWindow.on("closed", () => {
        kioskWindow = null;
    });
});
