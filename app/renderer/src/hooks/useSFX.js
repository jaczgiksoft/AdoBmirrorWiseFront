import { useCallback, useRef, useEffect } from "react";

/**
 * 🎵 useSFX — Sistema unificado de efectos de sonido POS
 *
 * Permite reproducir sonidos por nombre:
 *   const sfx = useSFX();
 *   sfx.play("approved");
 *
 * Los sonidos se precargan automáticamente en memoria al montar la app.
 */
export function useSFX(volume = 0.8) {
    const sounds = useRef({});

    // 🔹 Precarga automática (una sola vez)
    useEffect(() => {
        const soundMap = {
            approved: "/src/assets/sfx/approved.wav",
            cashMovement: "/src/assets/sfx/cashMovement.wav",
            confirmExit: "/src/assets/sfx/confirmExit.wav",
            lowStock: "/src/assets/sfx/lowStock.wav",
            notFound: "/src/assets/sfx/notFound.wav",
        };

        Object.entries(soundMap).forEach(([key, src]) => {
            const audio = new Audio(src);
            audio.volume = volume;
            audio.load();
            sounds.current[key] = audio;
        });

        console.log("🎧 useSFX precargó", Object.keys(soundMap).length, "sonidos");
    }, [volume]);

    // 🔸 Reproducir un sonido por nombre
    const play = useCallback((name) => {
        const sound = sounds.current[name];
        if (!sound) {
            console.warn(`⚠️ SFX '${name}' no existe o no se precargó.`);
            return;
        }

        try {
            // Reinicia y reproduce desde el inicio
            sound.currentTime = 0;
            sound.play();
        } catch (err) {
            console.warn(`🎵 Error al reproducir '${name}':`, err.message);
        }
    }, []);

    return { play };
}
