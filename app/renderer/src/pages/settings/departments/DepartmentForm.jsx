import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { createDepartment, updateDepartment } from "@/services/department.service";
import { ConfirmDialog } from "@/components/feedback";
import { useHotkeys } from "@/hooks/useHotkeys";

export default function DepartmentForm({ open, onClose, onCreated, department }) {
    const isEditMode = Boolean(department);
    const { addToast } = useToastStore();

    const initialForm = {
        name: "",
        description: "",
        profit_margin: "",
        use_parent_profit_margin: true,
        status: "active",
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});
    const firstRef = useRef(null);

    useEffect(() => {
        if (department) {
            setForm({
                name: department.name || "",
                description: department.description || "",
                profit_margin: department.profit_margin ?? "",
                use_parent_profit_margin: department.use_parent_profit_margin ?? true,
                status: department.status || "active",
            });
        } else {
            setForm(initialForm);
        }
    }, [department, open]);

    useEffect(() => {
        if (open) firstRef.current?.focus();
    }, [open]);

    // 🎹 Atajos
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;
                e.preventDefault();
                if (hasFormChanges()) setConfirmCancel(true);
                else handleExit();
                return "prevent";
            },
            enter: (e) => {
                if (!open) return;
                e.preventDefault();
                const valid = validateForm();
                if (valid) handleSubmit();
                else
                    addToast({
                        type: "warning",
                        title: "Campos incompletos",
                        message: "Por favor completa los campos obligatorios.",
                    });
                return "prevent";
            },
        },
        [open, form]
    );

    const hasFormChanges = () => {
        return Object.entries(form).some(([k, v]) => v && v !== initialForm[k]);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Campo obligatorio";
        if (
            !form.use_parent_profit_margin &&
            (form.profit_margin === "" || form.profit_margin < 0)
        )
            newErrors.profit_margin = "Ingresa un margen válido";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({
            ...f,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                profit_margin:
                    form.profit_margin === ""
                        ? null
                        : parseFloat(parseFloat(form.profit_margin).toFixed(4)),
            };

            if (isEditMode) {
                await updateDepartment(department.id, payload);
                addToast({
                    type: "success",
                    title: "Departamento actualizado",
                    message: `${form.name} fue actualizado correctamente.`,
                });
            } else {
                await createDepartment(payload);
                addToast({
                    type: "success",
                    title: "Departamento creado",
                    message: `${form.name} fue creado correctamente.`,
                });
            }
            handleExit();
            onCreated?.();
        } catch (err) {
            console.error("❌ Error al guardar departamento:", err);
            addToast({
                type: "error",
                title: "Error al guardar",
                message:
                    err.response?.data?.message ||
                    "No se pudo guardar el departamento.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExit = () => {
        setForm(initialForm);
        setErrors({});
        setConfirmCancel(false);
        onClose?.();
    };

    if (!open) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-secondary rounded-2xl shadow-xl border border-slate-700 w-[520px] max-h-[90vh] overflow-y-auto p-6"
                >
                    {/* 🔹 Encabezado */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-primary">
                            {isEditMode
                                ? "Editar departamento"
                                : "Registrar nuevo departamento"}
                        </h2>
                        <button
                            onClick={() =>
                                hasFormChanges() ? setConfirmCancel(true) : handleExit()
                            }
                            className="text-slate-400 hover:text-white transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* 🧾 Formulario */}
                    <div className="flex flex-col gap-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm mb-2 label-required">Nombre</label>
                            <input
                                ref={firstRef}
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Ej. Abarrotes"
                                className={`input ${
                                    errors.name
                                        ? "border-error ring-1 ring-error/50"
                                        : ""
                                }`}
                            />
                            {errors.name && (
                                <p className="text-xs text-error mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm mb-2">Descripción</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Ej. Productos de abarrotes y despensa."
                                className="input h-20 text-sm resize-none"
                            />
                        </div>

                        {/* 💰 Configuración de margen */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="use_parent_profit_margin"
                                    checked={form.use_parent_profit_margin}
                                    onChange={handleChange}
                                    className="cursor-pointer"
                                />
                                <label className="text-sm text-slate-300">
                                    Usar margen del cliente general
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm mb-2">
                                    Margen de ganancia global (%)
                                </label>
                                <input
                                    type="number"
                                    name="profit_margin"
                                    step="0.0001"
                                    min="0"
                                    max="100"
                                    value={form.profit_margin ?? ""}
                                    onChange={handleChange}
                                    disabled={form.use_parent_profit_margin}
                                    className={`input text-right ${
                                        form.use_parent_profit_margin
                                            ? "opacity-60 cursor-not-allowed"
                                            : ""
                                    } ${
                                        errors.profit_margin
                                            ? "border-error ring-1 ring-error/50"
                                            : ""
                                    }`}
                                    placeholder="Ej. 15.0000"
                                />
                                {errors.profit_margin && (
                                    <p className="text-xs text-error mt-1">
                                        {errors.profit_margin}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Estatus */}
                        <div>
                            <label className="block text-sm mb-2">Estatus</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    {/* 🔘 Botones */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() =>
                                hasFormChanges() ? setConfirmCancel(true) : handleExit()
                            }
                            className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer"
                        >
                            ESC Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                                const valid = validateForm();
                                if (valid) handleSubmit();
                                else
                                    addToast({
                                        type: "warning",
                                        title: "Campos incompletos",
                                        message:
                                            "Por favor completa los campos obligatorios.",
                                    });
                            }}
                            className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer"
                        >
                            {saving
                                ? "Guardando..."
                                : isEditMode
                                    ? "F5 Guardar cambios"
                                    : "F5 Guardar"}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Confirmación de salida */}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar edición"
                message="¿Deseas salir sin guardar los cambios? Se perderán los datos ingresados."
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
