import { useCallback, useRef } from "react";
import confirmExit from "@/assets/sfx/confirmExit.wav";

export function useBeep(src = confirmExit, volume = 0.7) {
    const audioRef = useRef(null);

    if (!audioRef.current) {
        const audio = new Audio(src);
        audio.volume = volume;
        audioRef.current = audio;
    }

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
