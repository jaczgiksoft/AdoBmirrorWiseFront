import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { createStore } from "@/services/store.service";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useModalForm } from "@/hooks/useModalForm";
import { ConfirmDialog } from "@/components/feedback";

export default function StoreForm({ open, onClose, onCreated }) {
    const { addToast } = useToastStore();

    const initialForm = {
        name: "",
        code: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        website: "",
        logo: null,
        banner: null,

        // 🧾 Datos fiscales
        use_parent_tax_data: false,
        tax_id: "",
        legal_name: "",
        regime: "",
        certificate_path: null,
        key_path: null,
        certificate_password: "",

        // ⚙️ Configuración POS
        use_parent_config: true,
        timezone: "America/Phoenix",
        currency: "MXN",
        opening_hours: "",
        exchange_rate: 1.0,
    };

    const [form, setForm] = useState(initialForm);
    const [previewLogo, setPreviewLogo] = useState(null);
    const [previewBanner, setPreviewBanner] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState("main");

    const firstRef = useRef(null);

    const hasFormChanges = () => {
        return Object.entries(form).some(([k, v]) => {
            if (k === "logo" || k === "banner") return v !== null;
            return String(v || "").trim() !== "";
        });
    };

    // 🎹 Hotkeys
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return; // solo si el modal está abierto
                e.preventDefault();
                e.stopPropagation();
                if (confirmCancel) return; // evita duplicados
                if (hasFormChanges()) {
                    setConfirmCancel(true);
                } else {
                    handleExit();
                }
                return "prevent";
            },
            enter: (e) => {
                if (!open || confirmCancel) return; // 🧠 evita conflicto con el diálogo
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
// 🧠 Forzar reactivación del ESC después de cerrar el ConfirmDialog
    useEffect(() => {
        if (open && !confirmCancel) {
            const restoreListener = (e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();

                    if (hasFormChanges()) {
                        setConfirmCancel(true);
                    } else {
                        handleExit();
                    }
                }
            };

            // Registro directo en window para restaurar el control
            window.addEventListener("keydown", restoreListener, true);

            // Cleanup
            return () => {
                window.removeEventListener("keydown", restoreListener, true);
            };
        }
    }, [confirmCancel, open]);


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

        // ✅ ahora esta función sí existe
        window.electronAPI?.onSaveShortcut(handleSaveShortcut);

        return () => {
            window.electronAPI?.onSaveShortcut(null);
        };
    }, [open, form, confirmCancel]);


    useEffect(() => {
        if (open) firstRef.current?.focus();
    }, [open]);

    const handleChange = (e) => {
        const { name, value, files, type, checked } = e.target;

        if (files?.[0]) {
            const file = files[0];
            setForm((f) => ({ ...f, [name]: file }));
            if (name === "logo") setPreviewLogo(URL.createObjectURL(file));
            if (name === "banner") setPreviewBanner(URL.createObjectURL(file));
        } else if (type === "checkbox") {
            setForm((f) => ({ ...f, [name]: checked }));
        } else {
            setForm((f) => ({ ...f, [name]: value }));

            setErrors((prev) => {
                const newErr = { ...prev };
                if (value.trim() !== "" && newErr[name]) delete newErr[name];
                if (name === "email") {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value.trim()))
                        newErr.email = "Formato de correo inválido";
                    else delete newErr.email;
                }
                if (name === "phone") {
                    if (!/^\d{10}$/.test(value))
                        newErr.phone = "El teléfono debe tener 10 dígitos";
                    else delete newErr.phone;
                }
                return newErr;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ["name", "code"];
        requiredFields.forEach((f) => {
            if (!form[f]) newErrors[f] = "Campo obligatorio";
        });
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            newErrors.email = "Formato de correo inválido";
        if (form.phone && !/^\d{10}$/.test(form.phone))
            newErrors.phone = "El teléfono debe tener 10 dígitos";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const data = new FormData();
            for (const [key, value] of Object.entries(form)) {
                if (
                    value !== null &&
                    value !== undefined &&
                    value !== "" &&
                    // 🔒 Permitir objetos File y Blob
                    (!(typeof value === "object") ||
                        value instanceof File ||
                        value instanceof Blob)
                ) {
                    data.append(key, value);
                }
            }

            const newStore = await createStore(data);
            addToast({
                type: "success",
                title: "Tienda registrada",
                message: `${form.name} fue creada correctamente.`,
            });
            handleExit();
            onCreated(newStore.store || newStore);
        } catch (err) {
            console.error("❌ Error al crear tienda:", err);
            addToast({
                type: "error",
                title: "Error al registrar tienda",
                message:
                    err.response?.data?.message ||
                    "No se pudo registrar la tienda. Verifica los datos o permisos.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExit = () => {
        setForm(initialForm);
        setPreviewLogo(null);
        setPreviewBanner(null);
        setErrors({});
        setActiveTab("main");
        onClose();
    };

    if (!open) return null;

    const tabs = [
        { id: "main", label: "Datos principales" },
        { id: "fiscal", label: "Datos fiscales" },
        { id: "config", label: "Configuración" },
    ];

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-secondary rounded-2xl shadow-xl border border-slate-700 w-[700px] max-h-[90vh] overflow-y-auto p-6"
                >
                    {/* Encabezado */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-primary">Registrar nueva tienda</h2>
                        <button
                            onClick={() =>
                                Object.values(form).some((v) => v)
                                    ? setConfirmCancel(true)
                                    : handleExit()
                            }
                            className="text-slate-400 hover:text-white transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Pestañas */}
                    <div className="flex border-b border-slate-700 mb-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 text-sm py-2 transition font-medium ${
                                    activeTab === tab.id
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Contenido por pestaña */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-3"
                        >
                            {/* 🏬 Datos principales */}
                            {activeTab === "main" && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm mb-2 label-required">Nombre</label>
                                            <input
                                                ref={firstRef}
                                                name="name"
                                                placeholder="Nombre de la tienda"
                                                value={form.name}
                                                onChange={handleChange}
                                                className={`input ${errors.name ? "border-error ring-1 ring-error/50" : ""}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-2 label-required">Código</label>
                                            <input
                                                name="code"
                                                placeholder="Ej. MZ01 o SUC01"
                                                value={form.code}
                                                onChange={handleChange}
                                                className={`input ${errors.code ? "border-error ring-1 ring-error/50" : ""}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm mb-2">Teléfono</label>
                                            <input
                                                name="phone"
                                                placeholder="Ej. 5544332211"
                                                value={form.phone}
                                                onChange={handleChange}
                                                className={`input ${errors.phone ? "border-error ring-1 ring-error/50" : ""}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-2">Correo electrónico</label>
                                            <input
                                                name="email"
                                                type="email"
                                                placeholder="ejemplo@dominio.com"
                                                value={form.email}
                                                onChange={handleChange}
                                                className={`input ${errors.email ? "border-error ring-1 ring-error/50" : ""}`}
                                            />
                                        </div>
                                    </div>

                                    <label className="block text-sm mb-2">Dirección</label>
                                    <input
                                        name="address"
                                        placeholder="Calle y número"
                                        value={form.address}
                                        onChange={handleChange}
                                        className="input"
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            name="city"
                                            placeholder="Ciudad"
                                            value={form.city}
                                            onChange={handleChange}
                                            className="input"
                                        />
                                        <input
                                            name="state"
                                            placeholder="Estado"
                                            value={form.state}
                                            onChange={handleChange}
                                            className="input"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            name="country"
                                            placeholder="País"
                                            value={form.country}
                                            onChange={handleChange}
                                            className="input"
                                        />
                                        <input
                                            name="postal_code"
                                            placeholder="Código postal"
                                            value={form.postal_code}
                                            onChange={handleChange}
                                            className="input"
                                        />
                                    </div>

                                    <input
                                        name="website"
                                        placeholder="https://ejemplo.com"
                                        value={form.website}
                                        onChange={handleChange}
                                        className="input"
                                    />

                                    {/* Archivos */}
                                    <div className="flex flex-col gap-3 mt-3">
                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer flex items-center gap-2 text-slate-300 hover:text-primary transition">
                                                <UploadCloud size={18} />
                                                <span>Seleccionar logo</span>
                                                <input
                                                    type="file"
                                                    name="logo"
                                                    accept="image/*"
                                                    onChange={handleChange}
                                                    className="hidden"
                                                />
                                            </label>
                                            {previewLogo && (
                                                <img
                                                    src={previewLogo}
                                                    alt="Logo"
                                                    className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                                                />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer flex items-center gap-2 text-slate-300 hover:text-primary transition">
                                                <UploadCloud size={18} />
                                                <span>Seleccionar banner</span>
                                                <input
                                                    type="file"
                                                    name="banner"
                                                    accept="image/*"
                                                    onChange={handleChange}
                                                    className="hidden"
                                                />
                                            </label>
                                            {previewBanner && (
                                                <img
                                                    src={previewBanner}
                                                    alt="Banner"
                                                    className="w-20 h-10 rounded-md object-cover border border-slate-700"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* 🧾 Datos fiscales */}
                            {activeTab === "fiscal" && (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="checkbox"
                                            name="use_parent_tax_data"
                                            checked={form.use_parent_tax_data}
                                            onChange={handleChange}
                                            className="cursor-pointer"
                                        />
                                        <label className="text-sm text-slate-300">
                                            Usar los datos fiscales del Cliente General
                                        </label>
                                    </div>

                                    <div
                                        className={`flex flex-col gap-3 transition-opacity ${
                                            form.use_parent_tax_data ? "opacity-50" : "opacity-100"
                                        }`}
                                    >
                                        <input
                                            name="tax_id"
                                            placeholder="RFC (13 caracteres)"
                                            value={form.tax_id}
                                            onChange={handleChange}
                                            disabled={form.use_parent_tax_data}
                                            className="input"
                                        />
                                        <input
                                            name="legal_name"
                                            placeholder="Razón social"
                                            value={form.legal_name}
                                            onChange={handleChange}
                                            disabled={form.use_parent_tax_data}
                                            className="input"
                                        />
                                        <input
                                            name="regime"
                                            placeholder="Régimen fiscal"
                                            value={form.regime}
                                            onChange={handleChange}
                                            disabled={form.use_parent_tax_data}
                                            className="input"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="file"
                                                name="certificate_path"
                                                accept=".cer"
                                                disabled={form.use_parent_tax_data}
                                                onChange={handleChange}
                                                className="input text-slate-400"
                                            />
                                            <input
                                                type="file"
                                                name="key_path"
                                                accept=".key"
                                                disabled={form.use_parent_tax_data}
                                                onChange={handleChange}
                                                className="input text-slate-400"
                                            />
                                        </div>
                                        <input
                                            type="password"
                                            name="certificate_password"
                                            placeholder="Contraseña del certificado"
                                            value={form.certificate_password}
                                            onChange={handleChange}
                                            disabled={form.use_parent_tax_data}
                                            className="input"
                                        />
                                    </div>
                                </>
                            )}

                            {/* ⚙️ Configuración */}
                            {activeTab === "config" && (
                                <>
                                    {/* Toggle para usar configuración del cliente general */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="checkbox"
                                            name="use_parent_config"
                                            checked={form.use_parent_config}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    use_parent_config: e.target.checked,
                                                }))
                                            }
                                            className="cursor-pointer"
                                        />
                                        <label className="text-sm text-slate-300">
                                            Usar configuración del cliente general (tipo de cambio, zona, etc.)
                                        </label>
                                    </div>

                                    <div
                                        className={`grid grid-cols-2 gap-3 transition-opacity ${
                                            form.use_parent_config ? "opacity-60 pointer-events-none" : "opacity-100"
                                        }`}
                                    >
                                        {/* Zona horaria */}
                                        <div>
                                            <label className="block text-sm mb-2">Zona horaria</label>
                                            <select
                                                name="timezone"
                                                value={form.timezone}
                                                onChange={handleChange}
                                                disabled={form.use_parent_config}
                                                className={`input ${
                                                    form.use_parent_config ? "cursor-not-allowed" : ""
                                                }`}
                                            >
                                                <option value="">Seleccionar zona horaria...</option>
                                                <option value="America/Phoenix">Arizona (sin horario de verano)</option>
                                                <option value="America/Hermosillo">Nogales, Sonora</option>
                                            </select>
                                        </div>

                                        {/* Moneda */}
                                        <div>
                                            <label className="block text-sm mb-2">Moneda</label>
                                            <select
                                                name="currency"
                                                value={form.currency}
                                                onChange={handleChange}
                                                disabled={form.use_parent_config}
                                                className={`input ${
                                                    form.use_parent_config ? "cursor-not-allowed" : ""
                                                }`}
                                            >
                                                <option value="">Seleccionar moneda...</option>
                                                <option value="MXN">MXN — Peso mexicano</option>
                                                <option value="USD">USD — Dólar estadounidense</option>
                                            </select>
                                        </div>

                                        {/* Tipo de cambio */}
                                        <div className="relative">
                                            <label className="block text-sm mb-2">Tipo de cambio</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                                                <input
                                                    type="number"
                                                    name="exchange_rate"
                                                    placeholder="Ej. 17.50"
                                                    step="0.01"
                                                    min="0"
                                                    value={form.exchange_rate ?? ""}
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            exchange_rate: e.target.value,
                                                        }))
                                                    }
                                                    onBlur={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) {
                                                            setForm((f) => ({
                                                                ...f,
                                                                exchange_rate: val.toFixed(2),
                                                            }));
                                                        }
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    disabled={form.use_parent_config}
                                                    className={`input pl-6 text-right ${
                                                        form.use_parent_config ? "cursor-not-allowed" : ""
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horario de apertura */}
                                    <div className="mt-3">
                                        <label className="block text-sm mb-2">Horario de apertura</label>
                                        <textarea
                                            name="opening_hours"
                                            placeholder="Ejemplo: Lunes a Viernes 9:00 a 18:00, Sábado 10:00 a 14:00"
                                            value={form.opening_hours}
                                            onChange={handleChange}
                                            disabled={form.use_parent_config}
                                            className={`input h-24 text-sm ${
                                                form.use_parent_config ? "opacity-60 cursor-not-allowed" : ""
                                            }`}
                                        />
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Indica los días y horarios de atención de forma libre.
                                        </p>
                                    </div>
                                </>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() =>
                                Object.values(form).some((v) => v)
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
