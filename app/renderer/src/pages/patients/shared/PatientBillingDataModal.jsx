import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Receipt, FilePlus } from "lucide-react";
import { ConfirmDialog } from "@/components/feedback";
import { useHotkeys } from "@/hooks/useHotkeys";

export default function PatientBillingDataModal({
    open,
    onClose,
    onSave,
    billingData,
}) {
    const firstRef = useRef(null);

    const TAX_REGIMES = [
        { code: "601", label: "601 – General de Ley Personas Morales" },
        { code: "605", label: "605 – Sueldos y Salarios" },
        { code: "606", label: "606 – Arrendamiento" },
        { code: "612", label: "612 – Personas Físicas con Actividades Empresariales" },
        { code: "626", label: "626 – Régimen Simplificado de Confianza (RESICO)" },
    ];

    const initialForm = {
        temp_id: "",
        business_name: "",
        rfc: "",
        tax_regime: "",
        zip_code: "",
        email: "",
        is_primary: false,
    };

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [confirmCancel, setConfirmCancel] = useState(false);

    // Cargar en edición / reset en nuevo
    useEffect(() => {
        if (billingData) {
            setForm(billingData);
        } else {
            setForm({
                ...initialForm,
                temp_id: `BILL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            });
        }
        setErrors({});
    }, [billingData]);

    useEffect(() => {
        if (open) firstRef.current?.focus();
    }, [open]);

    const validateForm = () => {
        const newErrors = {};

        if (!form.business_name.trim())
            newErrors.business_name = "Campo obligatorio";

        if (!form.rfc.trim())
            newErrors.rfc = "Campo obligatorio";

        if (!form.tax_regime.trim())
            newErrors.tax_regime = "Campo obligatorio";

        if (!form.zip_code.trim())
            newErrors.zip_code = "Campo obligatorio";

        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            newErrors.email = "Correo inválido";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirmSave = () => {
        if (!validateForm()) return;

        onSave(form);

        // Limpiar para nuevo registro
        setForm({
            ...initialForm,
            temp_id: `BILL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });

        onClose();
    };

    // Hotkeys
    useHotkeys(
        {
            escape: () => {
                if (!open) return "prevent";

                setConfirmCancel(true);
                return "prevent";
            },

            enter: () => {
                if (!open || confirmCancel) return "prevent";

                const ok = validateForm();
                if (ok) handleConfirmSave();

                return "prevent";
            },
        },
        [open, form, confirmCancel],
        open && !confirmCancel
    );

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
                        rounded-xl border border-slate-300 dark:border-slate-700
                        p-6 w-[500px] max-w-[95vw] shadow-xl
                    "
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-5">
                        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                            {billingData ? (
                                <>
                                    <Receipt size={20} />
                                    Editar datos fiscales
                                </>
                            ) : (
                                <>
                                    <FilePlus size={20} />
                                    Nuevo dato fiscal
                                </>
                            )}
                        </h2>

                        <button
                            onClick={() => setConfirmCancel(true)}
                            className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex flex-col gap-4">

                        {/* Business name */}
                        <div>
                            <label className="block text-sm mb-1 label-required">Razón social</label>
                            <input
                                ref={firstRef}
                                name="business_name"
                                value={form.business_name}
                                placeholder="Ej: Servicios Médicos XYZ"
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, business_name: e.target.value }))
                                }
                                className={`input ${errors.business_name ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                            {errors.business_name && (
                                <p className="text-error text-xs">{errors.business_name}</p>
                            )}
                        </div>

                        {/* RFC */}
                        <div>
                            <label className="block text-sm mb-1 label-required">RFC</label>
                            <input
                                name="rfc"
                                value={form.rfc}
                                placeholder="Ej: ABC123456T12"
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, rfc: e.target.value }))
                                }
                                className={`input ${errors.rfc ? "border-error" : ""}`}
                            />
                        </div>

                        {/* Régimen fiscal */}
                        <div>
                            <label className="block text-sm mb-1 label-required">Régimen fiscal</label>
                            <select
                                name="tax_regime"
                                value={form.tax_regime}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, tax_regime: e.target.value }))
                                }
                                className={`input ${errors.tax_regime ? "border-error" : ""}`}
                            >
                                <option value="">Seleccionar...</option>
                                {TAX_REGIMES.map((reg) => (
                                    <option key={reg.code} value={reg.code}>
                                        {reg.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* CP + Email */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 label-required">Código Postal</label>
                                <input
                                    name="zip_code"
                                    value={form.zip_code}
                                    placeholder="Ej: 06000"
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, zip_code: e.target.value }))
                                    }
                                    className={`input ${errors.zip_code ? "border-error" : ""}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Correo</label>
                                <input
                                    name="email"
                                    value={form.email}
                                    placeholder="facturacion@ejemplo.com"
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, email: e.target.value }))
                                    }
                                    className={`input ${errors.email ? "border-error" : ""}`}
                                />
                                {errors.email && (
                                    <p className="text-error text-xs">{errors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* is_primary */}
                        <label
                            className="
                                flex items-center justify-between
                                p-3 rounded-xl cursor-pointer
                                bg-slate-100 dark:bg-slate-800
                                border border-slate-300 dark:border-slate-700
                            "
                            onClick={() =>
                                setForm((f) => ({ ...f, is_primary: !f.is_primary }))
                            }
                        >
                            <span className="text-sm">Marcar como dato fiscal principal</span>

                            <div
                                className={`
                                    w-10 h-5 rounded-full relative transition-all
                                    ${form.is_primary
                                        ? "bg-primary/70"
                                        : "bg-slate-400 dark:bg-slate-600"
                                    }
                                `}
                            >
                                <div
                                    className={`
                                        absolute top-[2px] left-[2px] w-4 h-4 rounded-full 
                                        bg-white dark:bg-slate-200 transition-all
                                        ${form.is_primary ? "translate-x-5" : ""}
                                    `}
                                ></div>
                            </div>
                        </label>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setConfirmCancel(true)}
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
                message="¿Deseas salir sin guardar este dato fiscal?"
                onConfirm={onClose}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </>,
        document.body
    );
}
