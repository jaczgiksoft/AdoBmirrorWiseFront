import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const isDev = mode !== "production";

    // 🧩 Ajuste inteligente de la API base:
    // Si existe VITE_API_URL, úsala.
    // Si no, arma una por defecto basada en VITE_API_PORT.
    const apiUrl =
        env.VITE_API_URL ||
        `http://localhost:${env.VITE_API_PORT || 4545}/api`;

    return {
        root: "app/renderer",
        base: "./", // ✅ rutas relativas compatibles con Electron (file://)
        plugins: [react(), tailwindcss(), svgr()],

        resolve: {
            alias: {
                "@": path.resolve(__dirname, "app/renderer/src").replace(/\\/g, "/"),
            },
        },

        build: {
            outDir: "../renderer/dist",
            emptyOutDir: true,
            sourcemap: isDev,
            target: "esnext",
            rollupOptions: {
                output: {
                    manualChunks: undefined,
                },
            },
        },

        server: {
            host: "localhost",
            port: parseInt(env.VITE_PORT || "5173", 10),
            strictPort: true,
            open: false,
            cors: true,
            hmr: { overlay: true },
        },

        define: {
            "process.env": {
                ...process.env,
                VITE_APP_NAME: JSON.stringify(env.VITE_APP_NAME),
                VITE_SPLASH_TIME: JSON.stringify(env.VITE_SPLASH_TIME),
                VITE_PORT: JSON.stringify(env.VITE_PORT),
                VITE_API_PORT: JSON.stringify(env.VITE_API_PORT),
                VITE_API_URL: apiUrl, // ✅ sin JSON.stringify
            },
        },
    };
});
