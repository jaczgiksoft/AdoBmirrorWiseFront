import { useEffect } from "react";
import approved from "@/assets/sfx/approved.wav";
import cashMovement from "@/assets/sfx/cashMovement.wav";
import confirmExit from "@/assets/sfx/confirmExit.wav";
import lowStock from "@/assets/sfx/lowStock.wav";
import notFound from "@/assets/sfx/notFound.wav";

export function usePreloadSFX() {
    useEffect(() => {
        const sounds = [
            approved,
            cashMovement,
            confirmExit,
            lowStock,
            notFound,
        ];

        sounds.forEach((src) => {
            const audio = new Audio(src);
            audio.load();
        });
        console.log("🔊 SFX precargados:", sounds.length);
    }, []);
}
