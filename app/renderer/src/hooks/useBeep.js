import { useCallback, useRef } from "react";

/**
 * 🎵 useBeep — Hook para reproducir sonidos del sistema POS
 * @param {string} src - Ruta al archivo de sonido
 * @param {number} volume - Volumen (0.0 a 1.0)
 * @returns {function} playBeep - Función para ejecutar el sonido
 */
export function useBeep(src = "/src/assets/sfx/confirmExit.wav", volume = 0.7) {
    const audioRef = useRef(null);

    // Inicializa el audio solo una vez
    if (!audioRef.current) {
        const audio = new Audio(src);
        audio.volume = volume;
        audioRef.current = audio;
    }

    // Función para reproducir el sonido
    const playBeep = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        try {
            audio.currentTime = 0;
            audio.play();
        } catch (err) {
            console.warn("⚠️ No se pudo reproducir el sonido:", err.message);
        }
    }, []);

    return playBeep;
}
