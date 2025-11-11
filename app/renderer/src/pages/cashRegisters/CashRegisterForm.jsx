import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";
import { createCashRegister } from "@/services/cashRegister.service";
import { getStores } from "@/services/store.service";
import { useAuthStore } from "@/store/useAuthStore";

export default function CashRegisterForm({ open, onClose, onCreated }) {
    console.log("🧾 CashRegisterForm renderizado — open:", open);
    const { addToast } = useToastStore();

    const initialForm = {
        name: "",
        code: "",
        store_id: "",
        status: "active",
        is_main: false,
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});
    const [stores, setStores] = useState([]);
    const firstRef = useRef(null); // select Tienda

    const { user } = useAuthStore();
    const canWrite = user?.permissions?.cashRegisters?.write;

    // 🧮 Determina si hay cambios significativos (ignora el code autogenerado)
    const hasFormChanges = () => {
        return Object.entries(form).some(([k, v]) => {
            if (k === "code") return false;
            return v && v !== initialForm[k];
        });
    };

    // 🎹 Hotkeys
    useHotkeys(
        {
            escape: () => {
                if (!open) return;
                if (confirmCancel) return;
                if (hasFormChanges()) setConfirmCancel(true);
                else handleExit();
                return "prevent";
            },
            enter: () => {
                if (!open || confirmCancel) return;
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
            f5: () => {
                if (!open || confirmCancel) return;
                const isValid = validateForm();
                if (isValid) handleSubmit();
                return "prevent";
            },
        },
        [open, form, confirmCancel]
    );

    // 💾 Escucha atajo global F5 desde preload
    useEffect(() => {
        const handleSaveShortcut = () => {
            if (!open || confirmCancel) return;
            const isValid = validateForm();
            if (isValid) handleSubmit();
            else
                addToast({
                    type: "warning",
                    title: "Campos incompletos",
                    message: "Por favor completa los campos obligatorios.",
                });
        };

        window.electronAPI?.onSaveShortcut(handleSaveShortcut);
        return () => window.electronAPI?.onSaveShortcut(null);
    }, [open, form, confirmCancel]);

    // 🧩 Unificado: carga tiendas, genera código y hace focus al abrir
    useEffect(() => {
        console.log("📦 useEffect ejecutado con open =", open);
        if (!open) return;

        const initForm = async () => {
            console.log("⚙️ Iniciando carga del formulario de caja...");
            try {
                // Generar código automático (solo el nombre del equipo)
                const pcName = (await window.electronAPI.getPcName())?.toUpperCase() || "POS";
                setForm((prev) => ({ ...prev, code: pcName }));

                // Cargar tiendas
                const data = await getStores();
                setStores(data);
            } catch {
                setStores([]);
            } finally {
                setTimeout(() => firstRef.current?.focus(), 100); // focus en Tienda
            }
        };

        initForm();
    }, [open]);

    // 🔄 Manejadores
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
        if (!form.store_id) newErrors.store_id = "La tienda es obligatoria";
        if (!form.name) newErrors.name = "Campo obligatorio";
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
                store_id: form.store_id,
                status: form.status,
                is_main: form.is_main,
            };

            const newRegister = await createCashRegister(payload);

            addToast({
                type: "success",
                title: "Caja registrada",
                message: `${form.name} fue creada correctamente.`,
            });

            handleExit();
            onCreated?.(newRegister);
        } catch (err) {
            console.error("❌ Error al crear caja:", err);
            addToast({
                type: "error",
                title: "Error al registrar caja",
                message:
                    err.response?.data?.message ||
                    "No se pudo registrar la caja. Verifica los datos o permisos.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExit = () => {
        setForm(initialForm);
        setErrors({});
        onClose?.();
    };

    if (!open) return null;

    // 🚫 Si no tiene permiso de escritura, mostrar aviso bloqueante
    if (open && !canWrite) {
        return createPortal(
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] text-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-secondary p-8 rounded-2xl shadow-xl border border-slate-700 max-w-sm"
                >
                    <h2 className="text-lg font-semibold text-error mb-3">
                        Sin permisos para registrar caja
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        No tienes permiso para crear una nueva caja.
                        Contacta a un administrador para que asigne una a este equipo.
                    </p>

                    <button
                        onClick={() => {
                            const { logout } = useAuthStore.getState(); // acceder directamente al store
                            logout(); // cerrar sesión inmediata
                        }}
                        className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-sky-500 transition"
                    >
                        Entendido
                    </button>
                </motion.div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-secondary rounded-2xl shadow-xl border border-slate-700 w-[550px] max-h-[90vh] overflow-y-auto p-6"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-primary">
                            Registrar nueva caja
                        </h2>
                        <button
                            onClick={() =>
                                hasFormChanges()
                                    ? setConfirmCancel(true)
                                    : handleExit()
                            }
                            className="text-slate-400 hover:text-white transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Formulario principal */}
                    <div className="flex flex-col gap-3">
                        {/* Tienda */}
                        <div>
                            <label className="block text-sm mb-2 label-required">Tienda</label>
                            <select
                                ref={firstRef}
                                name="store_id"
                                value={form.store_id}
                                onChange={handleChange}
                                className={`input ${
                                    errors.store_id ? "border-error ring-1 ring-error/50" : ""
                                }`}
                            >
                                <option value="">Selecciona una tienda...</option>
                                {stores.map((store) => (
                                    <option key={store.id} value={store.id}>
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm mb-2 label-required">Nombre</label>
                            <input
                                name="name"
                                placeholder="Nombre de la caja"
                                value={form.name}
                                onChange={handleChange}
                                className={`input ${
                                    errors.name ? "border-error ring-1 ring-error/50" : ""
                                }`}
                            />
                        </div>

                        {/* Código */}
                        <div>
                            <label className="block text-sm mb-2 label-required">Código</label>
                            <input
                                name="code"
                                value={form.code}
                                readOnly
                                className="input bg-slate-800 text-slate-400 cursor-not-allowed select-all"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                                El código corresponde al nombre del equipo asignado.
                            </p>
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="block text-sm mb-2">Estado</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="active">Activa</option>
                                <option value="inactive">Inactiva</option>
                                <option value="maintenance">Mantenimiento</option>
                            </select>
                        </div>

                        {/* Caja principal */}
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
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() =>
                                hasFormChanges()
                                    ? setConfirmCancel(true)
                                    : handleExit()
                            }
                            className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer"
                        >
                            ESC Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const isValid = validateForm();
                                if (isValid) handleSubmit();
                                else
                                    addToast({
                                        type: "warning",
                                        title: "Campos incompletos",
                                        message: "Por favor completa los campos obligatorios.",
                                    });
                            }}
                            disabled={saving}
                            className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? "Guardando..." : "F5 Guardar"}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Confirmación de salida */}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar registro"
                message="¿Deseas salir sin guardar los cambios? Se perderán los datos ingresados."
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
                confirmVariant="error"
            />
        </>,
        document.body
    );
}
