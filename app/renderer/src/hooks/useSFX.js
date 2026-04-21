import { useCallback, useRef, useEffect } from "react";

import approved from "@/assets/sfx/approved.wav";
import cashMovement from "@/assets/sfx/cashMovement.wav";
import confirmExit from "@/assets/sfx/confirmExit.wav";
import lowStock from "@/assets/sfx/lowStock.wav";
import notFound from "@/assets/sfx/notFound.wav";

export function useSFX(volume = 0.8) {
    const sounds = useRef({});
    useEffect(() => {
        const soundMap = {
            approved,
            cashMovement,
            confirmExit,
            lowStock,
            notFound,
        };

        Object.entries(soundMap).forEach(([key, src]) => {
            const audio = new Audio(src);
            audio.volume = volume;
            audio.load();
            sounds.current[key] = audio;
        });

        console.log("🎧 useSFX precargó", Object.keys(soundMap).length, "sonidos");
    }, [volume]);

    const play = useCallback((name) => {
        const sound = sounds.current[name];
        if (!sound) {
            console.warn(`⚠️ SFX '${name}' no existe o no se precargó.`);
            return;
        }

        try {
            sound.currentTime = 0;
            sound.play();
        } catch (err) {
            console.warn(`🎵 Error al reproducir '${name}':`, err.message);
        }
    }, []);

    return { play };
}