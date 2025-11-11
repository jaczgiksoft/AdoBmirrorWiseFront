import { useEffect } from "react";

/**
 * Hook global para registrar atajos de teclado.
 * - Si un handler devuelve `true`, el evento no se propaga.
 * - Si el handler devuelve `"prevent"`, también se previene el comportamiento del navegador.
 */
export function useHotkeys(handlers = {}, deps = [], enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKey = (e) => {
            const key = e.key.toLowerCase();

            // ⚙️ F11 — anular pantalla completa del navegador
            if (key === "f11") {
                e.preventDefault(); // evita que active fullscreen
            }

            if (handlers[key]) {
                const result = handlers[key](e);

                if (result === "prevent" || result === true) {
                    e.preventDefault();
                    e.stopPropagation();

                    // 🚫 Evita que otros listeners globales también reciban el evento
                    if (typeof e.stopImmediatePropagation === "function") {
                        e.stopImmediatePropagation();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
