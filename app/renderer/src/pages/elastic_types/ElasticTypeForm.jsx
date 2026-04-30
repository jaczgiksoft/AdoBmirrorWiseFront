import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import BwiseColorPicker from "@/components/inputs/BwiseColorPicker";
import { useToastStore } from "@/store/useToastStore";
import { create, update } from "@/services/elasticType.service";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";
import { getRandomHexColor } from "@/utils/helpers";

export default function ElasticTypeForm({ open, onClose, onSaved, elasticToEdit = null }) {
    const { addToast } = useToastStore();

    const initialForm = {
        name: "",
        color: getRandomHexColor(),
        type: "",
        size: "",
        oz: "",
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});

    const firstRef = useRef(null);
    const isEditing = !!elasticToEdit;

    useEffect(() => {
        if (open) {
            if (elasticToEdit) {
                setForm({
                    ...initialForm,
                    ...elasticToEdit,
                });
            } else {
                setForm({ ...initialForm });
            }
            setTimeout(() => firstRef.current?.focus(), 50);
        }
    }, [open, elasticToEdit]);

    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;
                e.preventDefault();
                e.stopPropagation();
                if (confirmCancel) return;

                if (form.name || form.size) {
                    setConfirmCancel(true);
                } else {
                    handleExit();
                }
                return "prevent";
            },
            enter: (e) => {
                if (!open || confirmCancel) return;
                e.preventDefault();
                e.stopPropagation();
                const isValid = validateForm();
                if (isValid) handleSubmit();
                else
                    addToast({
                        type: "warning",
                        title: "Campos incompletos",
                        message: "Por favor completa los campos obligatorios.",
                    });
                return "prevent";
            },
        },
        [open, form, confirmCancel]
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

    const handleNumericChange = (e) => {
        const { value } = e.target;
        if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
            handleChange(e);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name?.trim()) newErrors.name = "El nombre es obligatorio";
        if (!form.size?.trim()) newErrors.size = "El tamaño es obligatorio";
        if (!form.oz?.trim()) newErrors.oz = "La fuerza (oz) es obligatoria";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const payload = { ...form };

            let result;
            if (isEditing) {
                result = await update(elasticToEdit.id, payload);
                addToast({
                    type: "success",
                    title: "Elástico actualizado",
                    message: `"${payload.name}" se actualizó correctamente.`,
                });
            } else {
                result = await create(payload);
                addToast({
                    type: "success",
                    title: "Elástico creado",
                    message: `"${payload.name}" se registró correctamente.`,
                });
            }

            onSaved(result);
            handleExit();
        } catch (err) {
            console.error("❌ Error al guardar elástico:", err);
            addToast({
                type: "error",
                title: "Error al guardar",
                message: err.message || "Ocurrió un error inesperado.",
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-secondary rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-[500px] max-h-[90vh] overflow-y-auto p-6"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-primary">
                            {isEditing ? "Editar tipo de elástico" : "Nuevo tipo de elástico"}
                        </h2>
                        <button
                            onClick={() => (form.name ? setConfirmCancel(true) : handleExit())}
                            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-sm mb-1 label-required">Marca / Nombre</label>
                                <input
                                    ref={firstRef}
                                    name="name"
                                    placeholder="Ej. Ormco"
                                    value={form.name}
                                    onChange={handleChange}
                                    className={`input ${errors.name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                                {errors.name && <span className="text-xs text-error mt-1">{errors.name}</span>}
                            </div>
                            <div className="w-28">
                                <BwiseColorPicker
                                    label="Color"
                                    color={form.color}
                                    onChange={(color) => setForm((f) => ({ ...f, color: color.hex }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Tipo de elástico</label>
                            <input
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej. Medium, Heavy"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 label-required">Tamaño</label>
                                <input
                                    name="size"
                                    placeholder="Ej. 3.5"
                                    value={form.size}
                                    onChange={handleNumericChange}
                                    className={`input ${errors.size ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                                {errors.size && <span className="text-xs text-error mt-1">{errors.size}</span>}
                            </div>
                            <div>
                                <label className="block text-sm mb-1 label-required">Fuerza (oz)</label>
                                <input
                                    name="oz"
                                    placeholder="Ej. 1/4"
                                    value={form.oz}
                                    onChange={handleChange}
                                    className={`input ${errors.oz ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                                {errors.oz && <span className="text-xs text-error mt-1">{errors.oz}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => (form.name ? setConfirmCancel(true) : handleExit())}
                            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer font-medium text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer font-medium text-sm shadow-lg shadow-sky-500/20"
                        >
                            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
                        </button>
                    </div>
                </motion.div>
            </div>

            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar edición"
                message="¿Deseas salir sin guardar los cambios?"
                onConfirm={() => {
                    setConfirmCancel(false);
                    handleExit();
                }}
                onCancel={() => {
                    setConfirmCancel(false);
                    setTimeout(() => firstRef.current?.focus(), 100);
                }}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="warning"
            />
        </>,
        document.body
    );
}
