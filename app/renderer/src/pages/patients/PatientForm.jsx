import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { createPatient } from "@/services/patient.service";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";

export default function PatientForm({ open, onClose, onCreated }) {
    const { addToast } = useToastStore();

    const initialForm = {
        medical_record_number: "",
        family_code: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        nickname: "",
        genre: "",
        birth_date: "",
        marital_status: "",
        phone_number: "",
        email: "",
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});
    const firstRef = useRef(null);

    useEffect(() => {
        if (open) firstRef.current?.focus();
    }, [open]);

    // 🎹 Atajos de teclado
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;
                e.preventDefault();
                if (Object.values(form).some((v) => v)) {
                    setConfirmCancel(true);
                } else {
                    handleExit();
                }
            },
            enter: (e) => {
                if (!open || confirmCancel) return;
                e.preventDefault();
                const isValid = validateForm();
                if (isValid) handleSubmit();
            },
        },
        [open, form, confirmCancel]
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));

        // Eliminar error si se corrige
        setErrors((prev) => {
            const updated = { ...prev };
            if (value.trim() !== "") delete updated[name];
            return updated;
        });
    };

    const validateForm = () => {
        const newErrors = {};
        const required = ["medical_record_number", "first_name", "last_name", "genre", "birth_date", "phone_number"];

        required.forEach((field) => {
            if (!form[field]?.trim()) newErrors[field] = "Campo obligatorio";
        });

        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            newErrors.email = "Correo inválido";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createPatient(form);
            addToast({
                type: "success",
                title: "Paciente registrado",
                message: `${form.first_name} ${form.last_name} fue agregado correctamente.`,
            });
            handleExit();
            onCreated?.();
        } catch (err) {
            console.error("❌ Error al registrar paciente:", err);
            addToast({
                type: "error",
                title: "Error al registrar paciente",
                message:
                    err.response?.data?.message ||
                    "No se pudo registrar el paciente. Verifica los campos o permisos.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExit = () => {
        setForm(initialForm);
        setErrors({});
        setConfirmCancel(false);
        onClose();
    };

    if (!open) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-secondary rounded-2xl shadow-xl border border-slate-700 w-[600px] max-h-[90vh] overflow-y-auto p-6"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-primary">Registrar nuevo paciente</h2>
                        <button
                            onClick={() =>
                                Object.values(form).some((v) => v)
                                    ? setConfirmCancel(true)
                                    : handleExit()
                            }
                            className="text-slate-400 hover:text-white transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Campos del formulario */}
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm mb-1 block">Número de expediente *</label>
                                <input
                                    ref={firstRef}
                                    name="medical_record_number"
                                    value={form.medical_record_number}
                                    onChange={handleChange}
                                    className={`input ${errors.medical_record_number ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="text-sm mb-1 block">Código familiar</label>
                                <input
                                    name="family_code"
                                    value={form.family_code}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm mb-1 block">Nombre *</label>
                                <input
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    className={`input ${errors.first_name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="text-sm mb-1 block">Apellido paterno *</label>
                                <input
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    className={`input ${errors.last_name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                name="middle_name"
                                placeholder="Apellido materno"
                                value={form.middle_name}
                                onChange={handleChange}
                                className="input"
                            />
                            <input
                                name="nickname"
                                placeholder="Apodo"
                                value={form.nickname}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm mb-1 block">Género *</label>
                                <select
                                    name="genre"
                                    value={form.genre}
                                    onChange={handleChange}
                                    className={`input ${errors.genre ? "border-error ring-1 ring-error/50" : ""}`}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="male">Masculino</option>
                                    <option value="female">Femenino</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm mb-1 block">Fecha de nacimiento *</label>
                                <input
                                    type="date"
                                    name="birth_date"
                                    value={form.birth_date}
                                    onChange={handleChange}
                                    className={`input ${errors.birth_date ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm mb-1 block">Estado civil</label>
                            <select
                                name="marital_status"
                                value={form.marital_status}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="soltero">Soltero/a</option>
                                <option value="casado">Casado/a</option>
                                <option value="divorciado">Divorciado/a</option>
                                <option value="viudo">Viudo/a</option>
                                <option value="union libre">Unión libre</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm mb-1 block">Teléfono *</label>
                                <input
                                    name="phone_number"
                                    value={form.phone_number}
                                    onChange={handleChange}
                                    className={`input ${errors.phone_number ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="text-sm mb-1 block">Correo electrónico</label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={`input ${errors.email ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() =>
                                Object.values(form).some((v) => v)
                                    ? setConfirmCancel(true)
                                    : handleExit()
                            }
                            className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
                        >
                            ESC Cancelar
                        </button>
                        <button
                            onClick={() => {
                                const isValid = validateForm();
                                if (isValid) handleSubmit();
                            }}
                            disabled={saving}
                            className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition disabled:opacity-50"
                        >
                            {saving ? "Guardando..." : "F5 Guardar"}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Confirmación al cerrar sin guardar */}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar registro"
                message="¿Deseas salir sin guardar los datos del paciente?"
                onConfirm={handleExit}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </>,
        document.body
    );
}
