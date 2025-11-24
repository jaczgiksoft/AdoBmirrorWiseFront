import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ShieldAlert, AlertCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/feedback";
import { useHotkeys } from "@/hooks/useHotkeys";

export default function PatientAlertModal({ open, onClose, onSave, alert }) {
    const firstRef = useRef(null);

    const initialForm = {
        title: "",
        description: "",
        is_admin_alert: false,
    };

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [confirmCancel, setConfirmCancel] = useState(false);

    // cargar datos para editar
    useEffect(() => {
        if (alert) setForm(alert);
        else setForm(initialForm);
        setErrors({});
    }, [alert]);

    // autofocus
    useEffect(() => {
        if (open) firstRef.current?.focus();
    }, [open]);

    // detectar si hay cambios → igual a StoreForm
    const hasFormChanges = () => {
        return (
            form.title.trim() !== "" ||
            form.description.trim() !== "" ||
            form.is_admin_alert !== false
        );
    };

    // validación estilo StoreForm
    const validateForm = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = "Campo obligatorio";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirmSave = () => {
        if (!validateForm()) return;
        onSave(form);
        setForm(initialForm);
    };

    // 🔥 HOTKEYS — SIN F5 (lo manejará Electron)
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;

                e.preventDefault();
                e.stopPropagation();

                if (confirmCancel) return "prevent";

                if (hasFormChanges()) {
                    setConfirmCancel(true);
                } else {
                    closeForm();
                }

                return "prevent";
            },

            enter: (e) => {
                if (!open || confirmCancel) return "prevent";

                e.preventDefault();
                e.stopPropagation();

                const isValid = validateForm();
                if (isValid) handleConfirmSave();

                return "prevent";
            },
        },

        // dependencias
        [open, form, confirmCancel],

        // enabled (para NO chocar con formularios padres)
        open && !confirmCancel
    );

    // 🔥 Listener de F5 DESDE ELECTRON (shortcut:save)
    useEffect(() => {
        if (!open) return;

        window.electronAPI?.onSaveShortcut(() => {
            if (!open || confirmCancel) return;

            const isValid = validateForm();
            if (isValid) handleConfirmSave();
        });
    }, [open, form, confirmCancel]);

    const closeForm = () => {
        setForm(initialForm);
        onClose();
    };

    if (!open) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="
                        bg-white dark:bg-secondary
                        rounded-xl border
                        border-slate-300 dark:border-slate-700
                        p-6 w-[450px] shadow-xl
                    "
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                                {form.is_admin_alert ? (
                                    <>
                                        <ShieldAlert size={20} className="text-yellow-500 dark:text-yellow-400" />
                                        {alert ? "Editar alerta administrativa" : "Nueva alerta administrativa"}
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={20} className="text-blue-500 dark:text-blue-400" />
                                        {alert ? "Editar alerta" : "Nueva alerta"}
                                    </>
                                )}
                            </h2>
                        </div>

                        <button
                            onClick={() =>
                                hasFormChanges()
                                    ? setConfirmCancel(true)
                                    : closeForm()
                            }
                            className="
                                text-slate-500 hover:text-slate-900
                                dark:text-slate-400 dark:hover:text-white
                            "
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex flex-col gap-4">
                        {/* TITLE */}
                        <div>
                            <label className="block text-sm mb-1 label-required">Título</label>
                            <input
                                ref={firstRef}
                                name="title"
                                value={form.title}
                                placeholder="Ej: Alergia a penicilina"
                                onChange={(e) => {
                                    setErrors((prev) => ({ ...prev, title: "" }));
                                    setForm((f) => ({ ...f, title: e.target.value }));
                                }}
                                className={`input ${errors.title ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                            {errors.title && (
                                <p className="text-error text-xs mt-1">{errors.title}</p>
                            )}
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <label className="block text-sm mb-1">Descripción</label>
                            <textarea
                                name="description"
                                value={form.description}
                                placeholder="Detalles adicionales…"
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, description: e.target.value }))
                                }
                                rows={3}
                                className="
                                    input resize-none
                                    text-slate-700 dark:text-slate-100
                                "
                            />
                        </div>

                        {/* TOGGLE ADMIN */}
                        <label
                            className="
                                flex items-center justify-between
                                p-3 rounded-xl cursor-pointer
                                bg-slate-100 dark:bg-slate-800
                                border border-slate-300 dark:border-slate-700
                                transition
                            "
                            onClick={() =>
                                setForm((f) => ({
                                    ...f,
                                    is_admin_alert: !f.is_admin_alert,
                                }))
                            }
                        >
                            <span className="text-sm flex items-center gap-2">
                                {form.is_admin_alert ? (
                                    <>
                                        <ShieldAlert size={18} className="text-yellow-500 dark:text-yellow-400" />
                                        <span className="text-yellow-600 dark:text-yellow-300">Administrativa</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={18} className="text-blue-500 dark:text-blue-300" />
                                        <span className="text-blue-600 dark:text-blue-300">Clínica</span>
                                    </>
                                )}
                            </span>

                            <div
                                className={`
                                    w-10 h-5 rounded-full relative transition-all
                                    ${form.is_admin_alert
                                    ? "bg-yellow-500/60"
                                    : "bg-slate-400 dark:bg-slate-600"
                                }
                                `}
                            >
                                <div
                                    className={`
                                        absolute top-[2px] left-[2px] w-4 h-4 rounded-full 
                                        bg-white dark:bg-slate-200 shadow
                                        transition-all
                                        ${form.is_admin_alert ? "translate-x-5" : ""}
                                    `}
                                ></div>
                            </div>
                        </label>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() =>
                                hasFormChanges()
                                    ? setConfirmCancel(true)
                                    : closeForm()
                            }
                            className="
                                px-3 py-2 rounded-lg
                                bg-slate-200 text-slate-700 hover:bg-slate-300
                                dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600
                            "
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={handleConfirmSave}
                            className="
                                px-3 py-2 rounded-lg
                                bg-primary text-white hover:bg-primary/90
                            "
                        >
                            Guardar
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* CONFIRM EXIT */}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar"
                message="¿Deseas salir sin guardar esta alerta?"
                onConfirm={() => {
                    setConfirmCancel(false);
                    closeForm();
                }}
                onCancel={() => {
                    setConfirmCancel(false);
                    setTimeout(() => firstRef.current?.focus(), 100);
                }}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </>,
        document.body
    );
}
