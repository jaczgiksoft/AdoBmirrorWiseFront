import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { openCashSession } from "@/services/cashSession.service";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { useSFX } from "@/hooks/useSFX"; // 🎵 efectos de sonido

export default function CashSessionModal({ open, onSuccess }) {
    const { user, currentStore, currentRegister, setCurrentSession, logout } = useAuthStore();
    const { addToast } = useToastStore();
    const { play } = useSFX();

    const [openingBalance, setOpeningBalance] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const inputRef = useRef(null);

    if (!open) return null;

    // 🎹 ESC → mostrar confirmación
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setShowCancelConfirm(true);
                play("confirmExit");
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [play]);

    const handleOpenSession = async (balanceValue) => {
        if (loading) return;

        const value = parseFloat(balanceValue ?? openingBalance);
        if (isNaN(value) || value < 0) {
            addToast({
                type: "warning",
                title: "Monto inválido",
                message: "Debes ingresar un monto de apertura válido.",
            });
            play("notFound");
            return;
        }

        setLoading(true);
        try {
            const session = await openCashSession({
                store_id: currentRegister.store_id,
                cash_register_id: currentRegister.id,
                opening_balance: value,
                notes: notes || null,
            });

            setCurrentSession(session);
            addToast({
                type: "success",
                title: "Caja abierta",
                message:
                    value > 0
                        ? `Sesión iniciada con $${value.toFixed(2)}.`
                        : "Sesión sin venta iniciada correctamente.",
            });

            play("cashMovement");
            onSuccess?.(session);
        } catch (err) {
            const msg =
                err?.message ||
                err?.error ||
                err?.response?.data?.message ||
                "No se pudo abrir la sesión de caja.";
            addToast({
                type: "error",
                title: "Error al abrir caja",
                message: msg,
            });
            console.error("❌ Error en apertura de caja:", err);
            play("notFound");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="bg-secondary border border-slate-700 rounded-2xl shadow-xl p-6 w-[420px] text-center"
            >
                <h2 className="text-xl font-semibold text-primary mb-2">Apertura de Caja</h2>
                <p className="text-slate-400 text-sm mb-5">
                    Ingresa el monto inicial para la caja{" "}
                    <b>{currentRegister?.name || "actual"}</b> en{" "}
                    <b>{currentStore?.name || "tienda asignada"}</b>.
                </p>

                <div className="flex flex-col gap-3 mb-4">
                    <input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        min="0"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        placeholder="Monto de apertura (MXN)"
                        className="input text-center font-semibold text-lg"
                        autoFocus
                    />
                    <textarea
                        placeholder="Notas opcionales..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input h-20 text-sm"
                    />
                </div>

                {/* 🧾 Botones */}
                <div className="flex justify-end gap-3">
                    <button
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
                        onClick={() => {
                            setShowCancelConfirm(true);
                            play("confirmExit");
                        }}
                        disabled={loading}
                    >
                        Cancelar
                    </button>

                    {/* ⚙️ Nueva opción: Sesión sin venta */}
                    <button
                        onClick={() => handleOpenSession(0)}
                        disabled={loading}
                        className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? "Abriendo..." : "Sesión sin venta"}
                    </button>

                    <button
                        onClick={() => handleOpenSession(openingBalance)}
                        disabled={loading}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-sky-500 transition disabled:opacity-50"
                    >
                        {loading ? "Abriendo..." : "Abrir caja"}
                    </button>
                </div>
            </motion.div>

            {/* 🧾 Confirmación de salida */}
            <ConfirmDialog
                open={showCancelConfirm}
                title="Cancelar apertura"
                message="¿Deseas salir sin abrir la sesión de caja?"
                onConfirm={() => {
                    setShowCancelConfirm(false);
                    logout();
                    play("confirmExit");
                }}
                onCancel={() => {
                    setShowCancelConfirm(false);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }}
                confirmLabel="Cerrar sesión"
                cancelLabel="Volver"
                confirmVariant="error"
            />
        </div>
    );
}
