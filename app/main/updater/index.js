const { checkForUpdates } = require("./updater.service");

async function initUpdater(mainWindow) {
    console.log("🧠 Updater inicializado");

    const result = await checkForUpdates();

    console.log("📦 Resultado del update:", result);

    if (result.hasUpdate) {
        console.log("🚀 Enviando evento al renderer...");

        mainWindow.webContents.send("app:update-available", result);
    } else {
        console.log("✅ No hay actualizaciones disponibles");
    }
}

module.exports = {
    initUpdater
};