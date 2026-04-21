const { app } = require("electron");
const axios = require("axios");

// 🔢 versión actual de la app
const CURRENT_VERSION = app.getVersion();
const API_URL = process.env.API_URL;

// 🧠 función principal
async function checkForUpdates() {
    try {
        console.log("🔍 Checking for updates...");

        const { data } = await axios.get(`${API_URL}/system/version`);

        const latestVersion = data.version;

        console.log("📌 Current version:", CURRENT_VERSION);
        console.log("📌 Latest version:", latestVersion);

        if (latestVersion !== CURRENT_VERSION) {
            console.log("🚀 Update disponible");

            return {
                hasUpdate: true,
                ...data
            };
        }

        console.log("✅ App actualizada");

        return { hasUpdate: false };

    } catch (error) {
        console.error("❌ Error checking updates:", error.message);
        return { hasUpdate: false };
    }
}

module.exports = {
    checkForUpdates
};