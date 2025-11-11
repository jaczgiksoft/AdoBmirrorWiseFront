import { useEffect } from "react";

/**
 * usePreloadSFX — precarga los sonidos para evitar latencia al usarlos
 */
export function usePreloadSFX() {
    useEffect(() => {
        const sounds = [
            "/src/assets/sfx/approved.wav",
            "/src/assets/sfx/cashMovement.wav",
            "/src/assets/sfx/confirmExit.wav",
            "/src/assets/sfx/lowStock.wav",
            "/src/assets/sfx/notFound.wav",
        ];

        sounds.forEach((src) => {
            const audio = new Audio(src);
            audio.load(); // 👈 carga el archivo en caché
        });

        console.log("🔊 SFX precargados:", sounds.length);
    }, []);
}
