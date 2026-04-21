import { useEffect, useState } from "react";

export function useAppUpdate() {
    const [update, setUpdate] = useState(null);

    useEffect(() => {
        console.log("🧠 Inicializando listener de updates...");

        // 🟢 1. Escuchar evento desde main (EL IMPORTANTE)
        window.electronAPI.on("app:update-available", (data) => {
            console.log("🚀 Update recibido por evento:", data);
            setUpdate(data);
        });

        // 🟢 2. Recuperar si ya ocurrió antes
        window.electronAPI.getUpdate().then((data) => {
            if (data?.hasUpdate) {
                console.log("📦 Update previo encontrado:", data);
                setUpdate(data);
            }
        });

        // 🟡 3. Fallback manual (tu lógica actual)
        window.electronAPI.checkUpdate().then((result) => {
            if (result?.hasUpdate) {
                console.log("📡 Update detectado manual:", result);
                setUpdate(result);
            }
        });

    }, []);

    return { update };
}