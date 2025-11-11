import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getCashRegisterById, updateCashRegister } from "@/services/cashRegister.service";
import { useToastStore } from "@/store/useToastStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";

export default function CashRegisterDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToastStore();

    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});
    const firstRef = useRef(null);

    /* 🔹 Cargar datos */
    useEffect(() => {
        async function loadCashRegister() {
            try {
                const data = await getCashRegisterById(id);
                setForm(data);
            } catch (err) {
                console.error("❌ Error al cargar caja:", err);
                addToast({
                    type: "error",
                    title: "Error al cargar caja",
                    message: "No se pudo obtener la información de la caja.",
                });
            }
        }
        loadCashRegister();
    }, [id]);

    // 🔹 Enfocar el campo "Nombre" al cargar datos
    useEffect(() => {
        if (form && firstRef.current) {
            firstRef.current.focus();
            firstRef.current.select();
        }
    }, [form]);

    /* 🎹 Hotkeys locales */
    useHotkeys(
        {
            escape: () => {
                if (confirmCancel) return;
                setConfirmCancel(true);
                return "prevent";
            },
            enter: () => {
                if (confirmCancel) return;
                const isValid = validateForm();
                if (isValid) handleSubmit();
                return "prevent";
            },
        },
        [form, confirmCancel]
    );

    /* 💾 Escucha el atajo global F5 desde Electron (shortcut:save) */
    useEffect(() => {
        if (!window.electronAPI?.onSaveShortcut) return;

        const handleSave = () => {
            const isValid = validateForm();
            if (isValid) handleSubmit();
        };

        // Registrar listener
        window.electronAPI.onSaveShortcut(handleSave);

        return () => {
            // Limpieza segura al desmontar
            if (window.electronAPI?.removeAllListeners) {
                window.electronAPI.removeAllListeners("shortcut:save");
            }
        };
    }, [form]);

    /* ⏳ Cargando */
    if (!form) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <p>Cargando datos de la caja...</p>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));

        setErrors((prev) => {
            const newErr = { ...prev };
            if (value.trim() !== "" && newErr[name]) delete newErr[name];
            return newErr;
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name) newErrors.name = "Campo obligatorio";
        if (!form.code) newErrors.code = "Campo obligatorio";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                code: form.code.trim(),
                store_id: form.store_id || null,
                status: form.status,
                is_main: form.is_main,
            };

            await updateCashRegister(id, payload);

            addToast({
                type: "success",
                title: "Caja actualizada",
                message: `${form.name} fue actualizada correctamente.`,
            });

            navigate("/cash-registers");
        } catch (err) {
            console.error("❌ Error al actualizar caja:", err);
            addToast({
                type: "error",
                title: "Error al actualizar caja",
                message:
                    err.response?.data?.message ||
                    "No se pudo actualizar la caja. Verifica los campos o permisos.",
            });
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleString("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
            });
        } catch {
            return "—";
        }
    };

    return (
        <div className="bg-dark flex flex-col font-sans text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-4xl mx-auto px-6 mt-6"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => navigate("/cash-registers")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-sm"
                    >
                        <X size={16} /> Volver a cajas
                    </button>
                    <h2 className="text-lg font-semibold text-primary">Editar Caja</h2>
                </div>

                {/* Formulario */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={form.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-3"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2 label-required">Nombre</label>
                                <input
                                    ref={firstRef}
                                    name="name"
                                    value={form.name || ""}
                                    onChange={handleChange}
                                    className={`input ${
                                        errors.name ? "border-error ring-1 ring-error/50" : ""
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2 label-required">Código</label>
                                <input
                                    name="code"
                                    value={form.code || ""}
                                    readOnly
                                    className="input"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2">Estado</label>
                                <select
                                    name="status"
                                    value={form.status || "active"}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="active">Activa</option>
                                    <option value="inactive">Inactiva</option>
                                    <option value="maintenance">Mantenimiento</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                name="is_main"
                                checked={form.is_main}
                                onChange={handleChange}
                                className="cursor-pointer"
                            />
                            <label className="text-sm text-slate-300">
                                Marcar como caja principal
                            </label>
                        </div>

                        {/* Fechas */}
                        <div className="text-xs text-slate-500 text-right mt-4">
                            <p>Creada: {formatDate(form.createdAt)}</p>
                            <p>Última actualización: {formatDate(form.updatedAt)}</p>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setConfirmCancel(true)}
                                className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Confirmación de salida */}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar edición"
                message="¿Deseas salir sin guardar los cambios? Se perderán los datos modificados."
                onConfirm={() => navigate("/cash-registers")}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </div>
    );
}
