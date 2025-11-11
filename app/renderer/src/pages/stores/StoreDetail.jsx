import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud } from "lucide-react";
import { getStoreById, updateStore } from "@/services/store.service";
import { useToastStore } from "@/store/useToastStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";
import { API_BASE } from "@/utils/apiBase";

export default function StoreDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToastStore();

    const [form, setForm] = useState(null);
    const [previewLogo, setPreviewLogo] = useState(null);
    const [previewBanner, setPreviewBanner] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState("main");
    const firstRef = useRef(null);

    // 🔹 Cargar datos de la tienda
    useEffect(() => {
        async function loadStore() {
            try {
                const data = await getStoreById(id);
                setForm(data);

                // 🔸 Construir URLs completas para imágenes si existen
                if (data.logo_url) setPreviewLogo(`${API_BASE}${data.logo_url}`);
                if (data.banner_url) setPreviewBanner(`${API_BASE}${data.banner_url}`);
            } catch (err) {
                console.error("❌ Error al cargar tienda:", err);
                addToast({
                    type: "error",
                    title: "Error al cargar tienda",
                    message: "No se pudo obtener la información de la tienda.",
                });
            }
        }
        loadStore();
    }, [id]);

    // 🎹 Hotkeys
    useHotkeys(
        {
            escape: (e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmCancel(true);
                return "prevent";
            },
            enter: (e) => {
                if (confirmCancel) return;
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
        [form, confirmCancel]
    );

    if (!form) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <p>Cargando datos de la tienda...</p>
            </div>
        );
    }

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
                        newErr.email = "Correo inválido";
                    else delete newErr.email;
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
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const data = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                if (value instanceof File || value instanceof Blob) {
                    data.append(key, value);
                } else if (typeof value === "boolean") {
                    data.append(key, value ? "true" : "false"); // ✅ los booleans siempre viajan
                } else if (value !== null && value !== undefined && value !== "") {
                    data.append(key, value);
                }
            });

            await updateStore(id, data);
            addToast({
                type: "success",
                title: "Tienda actualizada",
                message: `${form.name} fue actualizada correctamente.`,
            });
            navigate("/stores");
        } catch (err) {
            console.error("❌ Error al actualizar tienda:", err);
            addToast({
                type: "error",
                title: "Error al actualizar tienda",
                message:
                    err.response?.data?.message ||
                    "No se pudo actualizar la tienda. Verifica los campos o permisos.",
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

    const tabs = [
        { id: "main", label: "Datos principales" },
        { id: "fiscal", label: "Datos fiscales" },
        { id: "config", label: "Configuración" },
    ];

    return (
        <div className="bg-dark flex flex-col font-sans text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto px-6 mt-6"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => navigate("/stores")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-sm"
                    >
                        <X size={16} /> Volver a tiendas
                    </button>
                    <h2 className="text-lg font-semibold text-primary">
                        Editar Tienda
                    </h2>
                </div>

                {/* Tabs */}
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
                                        <label className="block text-sm mb-2 label-required">
                                            Nombre
                                        </label>
                                        <input
                                            ref={firstRef}
                                            name="name"
                                            value={form.name || ""}
                                            onChange={handleChange}
                                            className={`input ${
                                                errors.name
                                                    ? "border-error ring-1 ring-error/50"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2 label-required">
                                            Código
                                        </label>
                                        <input
                                            name="code"
                                            value={form.code || ""}
                                            onChange={handleChange}
                                            className={`input ${
                                                errors.code
                                                    ? "border-error ring-1 ring-error/50"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        name="phone"
                                        placeholder="Teléfono"
                                        value={form.phone || ""}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                    <input
                                        name="email"
                                        placeholder="Correo"
                                        value={form.email || ""}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>

                                <input
                                    name="address"
                                    placeholder="Dirección"
                                    value={form.address || ""}
                                    onChange={handleChange}
                                    className="input"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        name="city"
                                        placeholder="Ciudad"
                                        value={form.city || ""}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                    <input
                                        name="state"
                                        placeholder="Estado"
                                        value={form.state || ""}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        name="country"
                                        placeholder="País"
                                        value={form.country || ""}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                    <input
                                        name="postal_code"
                                        placeholder="Código postal"
                                        value={form.postal_code || ""}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>

                                <input
                                    name="website"
                                    placeholder="https://ejemplo.com"
                                    value={form.website || ""}
                                    onChange={handleChange}
                                    className="input"
                                />

                                <div className="flex flex-col gap-3 mt-3">
                                    <div className="flex items-center gap-3">
                                        <label className="cursor-pointer flex items-center gap-2 text-slate-300 hover:text-primary transition">
                                            <UploadCloud size={18} />
                                            <span>Cambiar logo</span>
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
                                            <span>Cambiar banner</span>
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
                                <h3 className="text-primary font-semibold mb-2">
                                    Datos fiscales
                                </h3>

                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        name="use_parent_tax_data"
                                        checked={form.use_parent_tax_data}
                                        onChange={handleChange}
                                        className="cursor-pointer"
                                    />
                                    <label className="text-sm text-slate-300">
                                        Usar los datos fiscales de Cliente
                                        General
                                    </label>
                                </div>

                                <div
                                    className={`flex flex-col gap-3 transition-opacity ${
                                        form.use_parent_tax_data
                                            ? "opacity-50"
                                            : "opacity-100"
                                    }`}
                                >
                                    <input
                                        name="tax_id"
                                        placeholder="RFC / Tax ID"
                                        value={form.tax_id || ""}
                                        onChange={handleChange}
                                        disabled={form.use_parent_tax_data}
                                        className="input"
                                    />
                                    <input
                                        name="legal_name"
                                        placeholder="Razón social"
                                        value={form.legal_name || ""}
                                        onChange={handleChange}
                                        disabled={form.use_parent_tax_data}
                                        className="input"
                                    />
                                    <input
                                        name="regime"
                                        placeholder="Régimen fiscal"
                                        value={form.regime || ""}
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
                                        value={form.certificate_password || ""}
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
                                        onChange={handleChange}
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
                                            value={form.timezone || ""}
                                            onChange={handleChange}
                                            disabled={form.use_parent_config}
                                            className={`input ${
                                                form.use_parent_config ? "cursor-not-allowed" : ""
                                            }`}
                                        >
                                            <option value="">Seleccionar zona...</option>
                                            <option value="America/Phoenix">Arizona (sin horario de verano)</option>
                                            <option value="America/Hermosillo">Nogales, Sonora</option>
                                        </select>
                                    </div>

                                    {/* Moneda */}
                                    <div>
                                        <label className="block text-sm mb-2">Moneda</label>
                                        <select
                                            name="currency"
                                            value={form.currency || ""}
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
                                                step="0.01"
                                                min="0"
                                                value={form.exchange_rate || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setForm((f) => ({
                                                        ...f,
                                                        exchange_rate: val,
                                                    }));
                                                }}
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
                                        value={form.opening_hours || ""}
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

                                {/* 🔘 Estado de la tienda (switch) */}
                                <div className="mt-6">
                                    <label className="block text-sm mb-2">Estado de la tienda</label>
                                    <div
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                status:
                                                    f.status === "active" ? "inactive" : "active",
                                            }))
                                        }
                                        className={`relative inline-flex items-center h-6 w-12 rounded-full cursor-pointer transition-colors ${
                                            form.status === "active"
                                                ? "bg-green-500"
                                                : "bg-slate-600"
                                        }`}
                                    >
                <span
                    className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        form.status === "active"
                            ? "translate-x-6"
                            : "translate-x-0"
                    }`}
                ></span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {form.status === "active" ? "Activa" : "Inactiva"}
                                    </p>
                                </div>
                            </>
                        )}

                    </motion.div>
                </AnimatePresence>

                {/* 🕒 Fechas */}
                <div className="text-xs text-slate-500 text-right mt-6">
                    <p>Fecha de registro: {formatDate(form.createdAt)}</p>
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

            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar edición"
                message="¿Deseas salir sin guardar los cambios? Se perderán los datos modificados."
                onConfirm={() => navigate("/stores")}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </div>
    );
}
