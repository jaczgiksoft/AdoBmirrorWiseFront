import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Box, Loader2 } from "lucide-react";
import BwiseColorPicker from "@/components/inputs/BwiseColorPicker";
import { useToastStore } from "@/store/useToastStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";
import bracketTypeService from "@/services/bracket_type.service";

export default function PatientBracketForm({ open, onClose, onSaved, itemToEdit = null }) {
    const { addToast } = useToastStore();

    const initialForm = {
        name: "",
        description: "",
        color: "#6366f1", // Default indigo 
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});

    const firstRef = useRef(null);
    const isEditing = !!itemToEdit;

    useEffect(() => {
        if (open) {
            if (itemToEdit) {
                setForm({
                    name: itemToEdit.name || "",
                    description: itemToEdit.description || "",
                    color: itemToEdit.color || "#6366f1",
                });
            } else {
                setForm({ ...initialForm, color: getRandomColor() });
            }
            // Pequeño delay para que el modal termine de animarse antes del focus
            const timer = setTimeout(() => firstRef.current?.focus(), 150);
            return () => clearTimeout(timer);
        }
    }, [open, itemToEdit]);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    // 🎹 Hotkeys
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;
                e.preventDefault();
                e.stopPropagation();
                if (confirmCancel || saving) return;

                if (form.name || form.description) {
                    setConfirmCancel(true);
                } else {
                    handleExit();
                }
                return "prevent";
            },
            enter: (e) => {
                if (!open || confirmCancel || saving) return;
                // Si estamos en un textarea, dejamos que Enter haga nueva línea
                if (document.activeElement.tagName === "TEXTAREA") return;

                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
                return "prevent";
            },
        },
        [open, form, confirmCancel, saving]
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErr = { ...prev };
                delete newErr[name];
                return newErr;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name?.trim()) newErrors.name = "El nombre es obligatorio";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (saving) return;

        if (!validateForm()) {
            addToast({
                type: "warning",
                title: "Campos incompletos",
                message: "Por favor completa los campos obligatorios.",
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description?.trim() || null,
                color: form.color,
            };

            let result;
            if (isEditing) {
                result = await bracketTypeService.update(itemToEdit.id, payload);
            } else {
                result = await bracketTypeService.create(payload);
            }

            addToast({
                type: "success",
                title: isEditing ? "Bracket actualizado" : "Bracket creado",
                message: `"${payload.name}" se guardó correctamente en la base de datos.`,
            });
            
            onSaved(result);
            handleExit();
        } catch (err) {
            console.error("❌ Error al guardar bracket:", err);
            const errorMsg = err.response?.data?.message || "No se pudo procesar la solicitud.";
            addToast({
                type: "error",
                title: "Error al guardar",
                message: errorMsg,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExit = () => {
        setForm(initialForm);
        setErrors({});
        onClose();
    };

    if (!open) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-secondary rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden flex flex-col"
                >
                    {/* Encabezado */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                                style={{ backgroundColor: form.color }}
                            >
                                <Box size={24} />
                            </div>
                            <h2 className="text-xl font-semibold text-primary">
                                {isEditing ? "Editar Bracket" : "Nuevo Bracket"}
                            </h2>
                        </div>
                        <button
                            onClick={() => (form.name || form.description ? setConfirmCancel(true) : handleExit())}
                            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Formulario */}
                    <div className="p-6 flex flex-col gap-5">

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 label-required text-slate-700 dark:text-slate-300">Marca / Tipo de Bracket</label>
                            <input
                                ref={firstRef}
                                name="name"
                                placeholder="Ej. Damon, Gemini, Cerámicos..."
                                value={form.name}
                                onChange={handleChange}
                                className={`input w-full ${errors.name ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                            {errors.name && <span className="text-xs text-error mt-1">{errors.name}</span>}
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Especificaciones</label>
                            <textarea
                                name="description"
                                placeholder="Detalles técnicos del bracket..."
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className="input w-full resize-none"
                            />
                        </div>

                        {/* Color */}
                        <div className="w-28">
                            <BwiseColorPicker
                                label="Color"
                                color={form.color}
                                onChange={(color) => setForm((f) => ({ ...f, color: color.hex }))}
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-dark/20 flex justify-end gap-3">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => (form.name || form.description ? setConfirmCancel(true) : handleExit())}
                            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer font-medium text-sm disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer font-semibold text-sm shadow-lg shadow-sky-500/20"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                isEditing ? "Actualizar" : "Guardar"
                            )}
                        </button>
                    </div>

                </motion.div>
            </div>

            <ConfirmDialog
                open={confirmCancel}
                title="Descartar cambios"
                message="¿Estás seguro de que deseas salir? Perderás los datos técnicos de este bracket."
                onConfirm={() => {
                    setConfirmCancel(false);
                    handleExit();
                }}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Sí, descartar"
                cancelLabel="Seguir editando"
                confirmVariant="warning"
            />
        </>,
        document.body
    );
}
