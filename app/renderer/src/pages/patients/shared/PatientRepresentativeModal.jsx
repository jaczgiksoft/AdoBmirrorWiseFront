import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, UserCheck, UserPlus, Copy } from "lucide-react";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";

export default function PatientRepresentativeModal({ open, onClose, onSave, representative, patientData }) {
    const firstRef = useRef(null);

    const initialForm = {
        temp_id: "",
        full_name: "",
        relationship: "",
        phone: "",
        phone_alt: "",
        email: "",
        address: "",
        can_login: true,
        username: "",
        password: "",
    };

    const RELATIONSHIP_OPTIONS = [
        "Padre",
        "Madre",
        "Tutor",
        "Abuelo(a)",
        "Hermano(a)",
        "Tío(a)",
        "Otro",
    ];

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [confirmCancel, setConfirmCancel] = useState(false);

    // Cargar para editar
    useEffect(() => {
        if (representative) {
            setForm(representative);
        } else {
            let addr = "";
            if (patientData) {
                addr = [
                    patientData.address_street_name,
                    patientData.address_street_number,
                    patientData.address_apartment_number ? `Int ${patientData.address_apartment_number}` : "",
                    patientData.address_neighborhood,
                    patientData.address_zip_code,
                    patientData.address_city
                ].filter(Boolean).join(", ");
            }

            setForm({
                ...initialForm,
                temp_id: `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                phone: patientData?.phone_number || "",
                email: patientData?.email || "",
                address: addr || ""
            });
        }
        setErrors({});
    }, [representative, open, patientData]);

    useEffect(() => {
        if (open) {
            firstRef.current?.focus();
        } else {
            setConfirmCancel(false);
        }
    }, [open]);

    // Autocompletar credenciales cuando can_login = true
    useEffect(() => {
        if (form.can_login && form.phone.trim()) {
            setForm((f) => ({
                ...f,
                username: f.phone,
                password: f.phone,
            }));
        }
    }, [form.can_login, form.phone]);

    const hasFormChanges = () =>
        JSON.stringify(form) !== JSON.stringify(initialForm);

    const validateForm = () => {
        const newErrors = {};
        if (!form.full_name.trim()) newErrors.full_name = "Campo obligatorio";
        if (!form.relationship) newErrors.relationship = "Campo obligatorio";
        if (!form.phone) newErrors.phone = "Campo obligatorio";

        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            newErrors.email = "Correo inválido";

        if (form.can_login && !form.phone) {
            newErrors.phone = "Requerido para generar usuario";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirmSave = () => {
        if (!validateForm()) return;
        onSave(form);

        // limpiar y regenerar ID
        setForm({
            ...initialForm,
            temp_id: `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });

        // cerrar modal
        onClose();
    };

    // HOTKEYS
    useHotkeys(
        {
            escape: () => {
                if (!open) return "prevent";
                if (confirmCancel) return "prevent";

                if (representative || form.full_name.trim()) {
                    setConfirmCancel(true);
                } else {
                    onClose();
                }
                return "prevent";
            },

            enter: () => {
                if (!open || confirmCancel) return "prevent";
                const valid = validateForm();
                if (valid) handleConfirmSave();
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
                        rounded-xl border
                        border-slate-300 dark:border-slate-700
                        p-6 w-[480px] shadow-xl
                    "
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-5">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                                {representative ? (
                                    <>
                                        <UserCheck size={20} />
                                        Editar representante
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={20} />
                                        Nuevo representante
                                    </>
                                )}
                            </h2>

                        </div>

                        <button
                            onClick={() =>
                                form.full_name.trim()
                                    ? setConfirmCancel(true)
                                    : onClose()
                            }
                            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex flex-col gap-3">

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm mb-1 label-required">Nombre completo</label>
                            <input
                                ref={firstRef}
                                name="full_name"
                                value={form.full_name}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, full_name: e.target.value }))
                                }
                                className={`input ${errors.full_name ? "border-error ring-1 ring-error/50" : ""}`}
                                placeholder="Ej: María López"
                            />
                            {errors.full_name && (
                                <p className="text-error text-xs">{errors.full_name}</p>
                            )}
                        </div>

                        {/* Relación */}
                        <div>
                            <label className="block text-sm mb-1 label-required">Relación</label>
                            <select
                                name="relationship"
                                value={form.relationship}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, relationship: e.target.value }))
                                }
                                className={`input ${errors.relationship ? "border-error ring-1 ring-error/50" : ""}`}
                            >
                                <option value="">Seleccionar...</option>
                                {RELATIONSHIP_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            {errors.relationship && (
                                <p className="text-error text-xs">{errors.relationship}</p>
                            )}
                        </div>

                        {/* Teléfonos */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 label-required">Teléfono</label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    placeholder="Ej: 55-1234-5678"
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, phone: e.target.value }))
                                    }
                                    className={`input ${errors.phone ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                                {errors.phone && (
                                    <p className="text-error text-xs">{errors.phone}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Teléfono alterno</label>
                                <input
                                    name="phone_alt"
                                    value={form.phone_alt}
                                    placeholder="Opcional"
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, phone_alt: e.target.value }))
                                    }
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm mb-1">Email</label>
                            <input
                                name="email"
                                value={form.email}
                                placeholder="correo@ejemplo.com"
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, email: e.target.value }))
                                }
                                className={`input ${errors.email ? "border-error" : ""}`}
                            />
                            {errors.email && (
                                <p className="text-error text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-sm mb-1">Dirección</label>
                            <input
                                name="address"
                                value={form.address}
                                placeholder="Calle, número, colonia…"
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, address: e.target.value }))
                                }
                                className="input"
                            />
                        </div>

                        {/* TOGGLE acceso */}
                        <label
                            className="
                                flex items-center justify-between
                                p-3 rounded-xl cursor-pointer
                                bg-slate-100 dark:bg-slate-800
                                border border-slate-300 dark:border-slate-700
                            "
                            onClick={() =>
                                setForm((f) => ({
                                    ...f,
                                    can_login: !f.can_login,
                                    username: "",
                                    password: "",
                                }))
                            }
                        >
                            <span className="text-sm flex items-center gap-2">
                                Acceso al portal
                            </span>

                            <div
                                className={`
                                    w-10 h-5 rounded-full relative transition-all
                                    ${form.can_login
                                        ? "bg-primary/70"
                                        : "bg-slate-400 dark:bg-slate-600"
                                    }
                                `}
                            >
                                <div
                                    className={`
                                        absolute top-[2px] left-[2px] w-4 h-4 rounded-full 
                                        bg-white dark:bg-slate-200 transition-all
                                        ${form.can_login ? "translate-x-5" : ""}
                                    `}
                                ></div>
                            </div>
                        </label>

                        {/* Credenciales (auto) */}
                        {form.can_login && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm mb-1">Usuario</label>
                                    <input
                                        value={form.username}
                                        disabled
                                        className="input opacity-60"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Contraseña</label>
                                    <input
                                        value={form.password}
                                        disabled
                                        className="input opacity-60"
                                    />
                                </div>
                            </div>
                        )}
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
                message="¿Deseas salir sin guardar este representante?"
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
