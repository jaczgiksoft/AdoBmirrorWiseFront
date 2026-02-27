import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useSFX } from "@/hooks/useSFX";

export default function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Sí, salir",
    cancelLabel = "Cancelar",
    confirmVariant = "error",
    requiresDoubleConfirm = false,
    secondTitle,
    secondMessage,
    secondConfirmLabel,
}) {
    const { play } = useSFX();
    const [selected, setSelected] = useState("cancel");
    const [isSecondStep, setIsSecondStep] = useState(false);
    const cancelRef = useRef(null);

    useEffect(() => {
        if (open) {
            setSelected("cancel");
            setIsSecondStep(false);
            setTimeout(() => cancelRef.current?.focus(), 100);
            play("confirmExit");
        }
    }, [open]);

    const handleConfirmAction = () => {
        if (requiresDoubleConfirm && !isSecondStep) {
            setIsSecondStep(true);
            setSelected("cancel");
        } else {
            onConfirm();
        }
    };

    // 🎹 Flechas ← →
    useEffect(() => {
        if (!open) return;

        const handleArrowKeys = (e) => {
            if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();

                if (e.key === "ArrowLeft") {
                    setSelected("cancel");
                } else if (e.key === "ArrowRight") {
                    setSelected("confirm");
                }

                play("confirmExit");
            }
        };

        // ✅ fase de captura: true
        document.addEventListener("keydown", handleArrowKeys, true);
        return () => document.removeEventListener("keydown", handleArrowKeys, true);
    }, [open]);

    // 🎹 Enter / Escape: manejados con listener local (garantizado)
    useEffect(() => {
        if (!open) return;

        const handleKeys = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (selected === "confirm") handleConfirmAction();
                else onCancel();
            }
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeys, true); // capture phase
        return () => document.removeEventListener("keydown", handleKeys, true);
    }, [open, selected, isSecondStep, requiresDoubleConfirm]);

    if (!open) return null;

    const confirmBase =
        confirmVariant === "error" ? "btn-primary bg-error" : "btn-primary";

    const displayTitle = isSecondStep ? (secondTitle || "¿Estás completamente seguro?") : title;
    const displayMessage = isSecondStep ? (secondMessage || "Esta acción es irreversible.") : message;
    const displayConfirmLabel = isSecondStep ? (secondConfirmLabel || "Sí, confirmar definitivamente") : confirmLabel;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-secondary/90 rounded-2xl shadow-hard p-6 w-[320px] border border-white/10 text-center"
                    >
                        <h2 className="text-lg font-semibold text-primary mb-2">{displayTitle}</h2>
                        <p className="text-slate-300 text-sm mb-6">{displayMessage}</p>

                        <div className="flex justify-center gap-3">
                            <button
                                ref={cancelRef}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCancel();
                                }}
                                className={`btn w-1/2 text-sm ${selected === "cancel"
                                        ? "btn-secondary ring-2 ring-primary btn-selected"
                                        : "btn-secondary opacity-80"
                                    }`}
                            >
                                {cancelLabel}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleConfirmAction();
                                }}
                                className={`btn w-1/2 text-sm ${confirmBase} ${selected === "confirm"
                                        ? "hover:bg-red-500 ring-2 ring-primary"
                                        : "opacity-90"
                                    }`}
                            >
                                {displayConfirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
