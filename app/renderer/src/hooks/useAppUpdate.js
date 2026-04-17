import { useEffect, useState } from "react";

export function useAppUpdate() {
    const [update, setUpdate] = useState(null);

    useEffect(() => {
        async function check() {
            try {
                console.log("📡 Llamando a checkUpdate...");

                const result = await window.electronAPI.checkUpdate();

                console.log("📦 Resultado manual:", result);

                if (result?.hasUpdate) {
                    setUpdate(result);
                }
            } catch (error) {
                console.error("❌ Error checking update:", error);
            }
        }

        check();
    }, []);

    return { update };
}