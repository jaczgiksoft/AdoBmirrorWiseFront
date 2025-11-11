import { useEffect, useCallback } from "react";
import { useHotkeys } from "@/hooks/useHotkeys";

/**
 * Hook base para formularios modales con soporte de:
 *  - ESC → confirmar o cerrar
 *  - ENTER → guardar
 *  - F5 → guardar global (desde main con Electron IPC)
 *
 * @param {Object} config
 * @param {boolean} config.open - Si el modal está abierto
 * @param {boolean} config.confirmCancel - Si el diálogo de confirmación está activo
 * @param {Function} config.setConfirmCancel - Setter del estado de confirmación
 * @param {Function} config.hasFormChanges - Devuelve true si el formulario tiene cambios
 * @param {Function} config.handleExit - Lógica para cerrar y limpiar el modal
 * @param {Function} config.trySave - Función que valida y guarda (equivalente a handleSubmit validado)
 * @param {Object} [config.firstRef] - Referencia al primer campo para foco inicial (opcional)
 */
export function useModalForm({
                                 open,
                                 confirmCancel,
                                 setConfirmCancel,
                                 hasFormChanges,
                                 handleExit,
                                 trySave,
                                 firstRef,
                             }) {
    // 🎹 Hotkeys locales (ESC, ENTER)
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;
                e.preventDefault();
                e.stopPropagation();
                if (confirmCancel) return;

                if (hasFormChanges()) setConfirmCancel(true);
                else handleExit();

                return "prevent";
            },
            enter: (e) => {
                if (!open || confirmCancel) return;
                e.preventDefault();
                e.stopPropagation();
                trySave();
                return "prevent";
            },
        },
        [open, confirmCancel]
    );

    // 🧠 Rehabilitar ESC tras cerrar el confirm dialog
    useEffect(() => {
        if (open && !confirmCancel) {
            const restoreListener = (e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    if (hasFormChanges()) setConfirmCancel(true);
                    else handleExit();
                }
            };
            window.addEventListener("keydown", restoreListener, true);
            return () => window.removeEventListener("keydown", restoreListener, true);
        }
    }, [confirmCancel, open]);

    // 💾 F5 global (IPC)
    useEffect(() => {
        const handleSaveShortcut = () => {
            if (!open || confirmCancel) return;
            trySave();
        };
        window.electronAPI?.onSaveShortcut(handleSaveShortcut);
        return () => {
            window.electronAPI?.onSaveShortcut(null);
        };
    }, [open, confirmCancel, trySave]);

    // 🎯 Foco inicial
    useEffect(() => {
        if (open && firstRef?.current) {
            setTimeout(() => firstRef.current?.focus(), 100);
        }
    }, [open, firstRef]);
}