// core/src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Usa el puerto definido en .env, o 4545 por defecto
const PORT = process.env.VITE_API_PORT || 4545;

app.use(cors());
app.use(express.json());

// 🩺 Endpoint básico para monitorear el estado del backend
app.get("/api/status", (req, res) => {
    res.json({
        status: "ok",
        mode: process.env.ONLINE === "true" ? "online" : "offline",
        time: new Date().toISOString(),
    });
});

// 🧩 Arranque del servidor
const server = app.listen(PORT, () => {
    console.log(`🧩 API local escuchando en http://localhost:${PORT}`);
});

// 🧹 Cierre limpio del servidor al terminar el proceso
process.on("SIGINT", () => {
    console.log("🛑 Servidor Express detenido por SIGINT (Ctrl+C)");
    server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
    console.log("🛑 Servidor Express detenido por SIGTERM");
    server.close(() => process.exit(0));
});

// Exporta la instancia (permite que Electron la cierre desde main.js)
module.exports = server;
