import { useEffect, useCallback } from "react";

/**
 * Hook global avanzado para registrar atajos de teclado.
 *
 * Características:
 * - Modo CAPTURE (true) para interceptar antes que otros listeners.
 * - Memoización del handler mediante useCallback.
 * - “enabled” permite bloquear o activar hotkeys dinámicamente.
 * - Si un handler retorna "prevent" o true → se detiene todo el evento.
 * - Automáticamente previene que F11 active el fullscreen del navegador.
 */
export function useHotkeys(handlers = {}, deps = [], enabled = true) {
    const handleKey = useCallback(
        (e) => {
            if (!enabled) return;

            const key = e.key.toLowerCase();

            // Bloquear F11 fullscreen del navegador
            if (key === "f11") {
                e.preventDefault();
            }

            const fn = handlers[key];
            if (!fn) return;

            const result = fn(e);

            // 🔒 Control total del evento
            if (result === "prevent" || result === true) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === "function") {
                    e.stopImmediatePropagation();
                }
            }
        },
        [enabled, ...deps] // Mantiene el handler sincronizado con el estado actual
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKey, true); // CAPTURE MODE

        return () => {
            window.removeEventListener("keydown", handleKey, true);
        };
    }, [handleKey, enabled]);
}
