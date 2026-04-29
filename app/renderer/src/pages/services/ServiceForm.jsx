import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import BwiseColorPicker from "@/components/inputs/BwiseColorPicker";
import { useToastStore } from "@/store/useToastStore";
import { create, update } from "@/services/service.service";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";

export default function ServiceForm({ open, onClose, onSaved, serviceToEdit = null }) {
    const { addToast } = useToastStore();

    const initialForm = {
        name: "",
        duration_minutes: "",
        price: "",
        suggested_units: "",
        unit_value: "",
        color: "#CCCCCC",
        requires_inventory: false,
        deductible: true,
        sat_code: "",
        cfdi_usage: "",
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});

    const firstRef = useRef(null);
    const isEditing = !!serviceToEdit;

    useEffect(() => {
        if (open) {
            if (serviceToEdit) {
                setForm({
                    ...initialForm,
                    ...serviceToEdit,
                    // Asegurar tipos correctos para inputs
                    duration_minutes: serviceToEdit.duration_minutes || "",
                    price: serviceToEdit.price || "",
                    suggested_units: serviceToEdit.suggested_units || "",
                    unit_value: serviceToEdit.unit_value || "",
                });
            } else {
                setForm({ ...initialForm, color: getRandomColor() });
            }
            // Pequeño timeout para asegurar que el modal renderizó
            setTimeout(() => firstRef.current?.focus(), 50);
        }
    }, [open, serviceToEdit]);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const hasFormChanges = () => {
        return Object.entries(form).some(([k, v]) => {
            if (isEditing && serviceToEdit[k] !== v) return true;
            if (!isEditing && initialForm[k] !== v) return true;
            return false;
        });
    };

    // 🎹 Hotkeys
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;
                e.preventDefault();
                e.stopPropagation();
                if (confirmCancel) return;

                // Si hay cambios y no estamos en confirmación, confirmar salida
                // Si no, salir directo
                // Simplificación: siempre confirmamos si hay datos básicos escritos en modo crear
                // o si hubo cambios en modo editar.

                if (form.name || form.price) { // Chequeo simple de "dirty"
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

    // Restaurar ESC global
    useEffect(() => {
        if (open && !confirmCancel) {
            const restoreListener = (e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    if (form.name) setConfirmCancel(true);
                    else handleExit();
                }
            };
            window.addEventListener("keydown", restoreListener, true);
            return () => window.removeEventListener("keydown", restoreListener, true);
        }
    }, [confirmCancel, open, form]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === "checkbox" ? checked : value;

        setForm((f) => ({ ...f, [name]: finalValue }));

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
        if (!form.duration_minutes) newErrors.duration_minutes = "Requerido";
        if (!form.price) newErrors.price = "Requerido";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            // Preparar payload
            const payload = { ...form };

            // Convertir numéricos
            payload.duration_minutes = parseInt(payload.duration_minutes) || 0;
            payload.price = parseFloat(payload.price) || 0;
            if (payload.suggested_units) payload.suggested_units = parseInt(payload.suggested_units);
            if (payload.unit_value) payload.unit_value = parseInt(payload.unit_value);

            let result;
            if (isEditing) {
                result = await update(serviceToEdit.id, payload);
                addToast({
                    type: "success",
                    title: "Servicio actualizado",
                    message: `"${payload.name}" se actualizó correctamente.`,
                });
            } else {
                result = await create(payload);
                addToast({
                    type: "success",
                    title: "Servicio creado",
                    message: `"${payload.name}" se registró correctamente.`,
                });
            }

            onSaved(result);
            handleExit();
        } catch (err) {
            console.error("❌ Error al guardar servicio:", err);
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
                    className="bg-white dark:bg-secondary rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-[600px] max-h-[90vh] overflow-y-auto p-6"
                >
                    {/* Encabezado */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-primary">
                            {isEditing ? "Editar servicio" : "Nuevo servicio"}
                        </h2>
                        <button
                            onClick={() => (form.name ? setConfirmCancel(true) : handleExit())}
                            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Formulario */}
                    <div className="flex flex-col gap-4">

                        {/* Nombre y Color */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-sm mb-1 label-required">Nombre del servicio</label>
                                <input
                                    ref={firstRef}
                                    name="name"
                                    placeholder="Ej. Limpieza dental profunda"
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

                        {/* Duración y Precio */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 label-required">Duración (min)</label>
                                <input
                                    type="number"
                                    name="duration_minutes"
                                    placeholder="Ej. 30"
                                    value={form.duration_minutes}
                                    onChange={handleChange}
                                    className={`input ${errors.duration_minutes ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 label-required">Precio base</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="0.00"
                                        step="0.01"
                                        value={form.price}
                                        onChange={handleChange}
                                        className={`
                input
                pl-7 pr-3
                text-right
                placeholder:text-right
                ${errors.price ? "border-error ring-1 ring-error/50" : ""}
            `}
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Unidades (Opcional) */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-dark/30 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                            <div>
                                <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">Unidades sugeridas</label>
                                <input
                                    type="number"
                                    name="suggested_units"
                                    placeholder="Ej. 2"
                                    value={form.suggested_units}
                                    onChange={handleChange}
                                    className="input text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">Valor por unidad</label>
                                <input
                                    type="number"
                                    name="unit_value"
                                    placeholder="Ej. 15"
                                    value={form.unit_value}
                                    onChange={handleChange}
                                    className="input text-sm"
                                />
                            </div>
                            <p className="col-span-2 text-[10px] text-slate-500">
                                * Se utiliza para calcular la productividad del doctor basada en unidades de tiempo/esfuerzo.
                            </p>
                        </div>

                        {/* Datos Fiscales (Simples) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Código SAT</label>
                                <input
                                    name="sat_code"
                                    placeholder="Ej. 85122000"
                                    value={form.sat_code}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Uso CFDI</label>
                                <input
                                    name="cfdi_usage"
                                    placeholder="Ej. D01"
                                    value={form.cfdi_usage}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-col sm:flex-row gap-6 mt-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="requires_inventory"
                                        checked={form.requires_inventory}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    {/* Track */}
                                    <div className="
                                        w-11 h-6 bg-slate-700 rounded-full border border-slate-600 transition-colors duration-300
                                        peer-checked:bg-primary peer-checked:border-primary
                                        peer-focus:ring-2 peer-focus:ring-primary/30
                                        group-hover:border-slate-500
                                    "></div>
                                    {/* Thumb */}
                                    <div className="
                                        absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300
                                        peer-checked:translate-x-5 shadow-sm
                                    "></div>
                                </div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                                    Requiere inventario
                                </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="deductible"
                                        checked={form.deductible}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    {/* Track */}
                                    <div className="
                                        w-11 h-6 bg-slate-700 rounded-full border border-slate-600 transition-colors duration-300
                                        peer-checked:bg-primary peer-checked:border-primary
                                        peer-focus:ring-2 peer-focus:ring-primary/30
                                        group-hover:border-slate-500
                                    "></div>
                                    {/* Thumb */}
                                    <div className="
                                        absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300
                                        peer-checked:translate-x-5 shadow-sm
                                    "></div>
                                </div>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                                    Es deducible
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Botones */}
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
                            {saving ? "Guardando..." : isEditing ? "Actualizar servicio" : "Guardar servicio"}
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
