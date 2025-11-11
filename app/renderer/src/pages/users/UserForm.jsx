// src/pages/settings/users/UserForm.jsx
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Eye, EyeOff, KeyRound, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
    generatePassword,
    getPasswordStrength,
    generateUsername,
} from "@/utils/helpers";
import { createUser } from "@/services/user.service";
import { getRoles } from "@/services/role.service";
import { getStores } from "@/services/store.service";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";
import FilteredSelect from "@/components/form/FilteredSelect";

export default function UserForm({ open, onClose, onCreated }) {
    const { addToast } = useToast();

    const initialForm = {
        first_name: "",
        last_name: "",
        second_last_name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        role_id: "",
        store_id: "",
        profile_image: null,
    };

    const [form, setForm] = useState(initialForm);
    const [roles, setRoles] = useState([]);
    const [stores, setStores] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [preview, setPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});

    const firstRef = useRef(null);

    const hasFormChanges = () => {
        return Object.entries(form).some(([k, v]) => {
            if (k === "profile_image") return v !== null;
            return String(v || "").trim() !== "";
        });
    };

    // 🎹 Hotkeys
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;
                e.preventDefault();
                e.stopPropagation();
                if (hasFormChanges()) {
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
                if (isValid) {
                    handleSubmit();
                } else {
                    addToast({
                        type: "warning",
                        title: "Campos incompletos",
                        message: "Por favor completa los campos obligatorios.",
                    });
                }
                return "prevent";
            },
            "ctrl+g": (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleGeneratePassword();
            },
        },
        [open, form, confirmCancel]
    );

    useEffect(() => {
        if (open) {
            loadData();
            setTimeout(() => firstRef.current?.focus(), 100);
        }
    }, [open]);

    const loadData = async () => {
        try {
            const [rolesData, storesData] = await Promise.all([
                getRoles(),
                getStores(),
            ]);
            setRoles(rolesData);
            setStores(storesData);
        } catch {
            addToast({
                type: "error",
                title: "Error al cargar datos",
                message: "No se pudieron cargar roles o tiendas.",
            });
        }
    };

    useEffect(() => {
        if (form.first_name && form.last_name && !form.username) {
            setForm((f) => ({
                ...f,
                username: generateUsername(f.first_name, f.last_name),
            }));
        }
    }, [form.first_name, form.last_name]);

    useEffect(() => {
        setPasswordStrength(getPasswordStrength(form.password));
    }, [form.password]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "profile_image" && files?.[0]) {
            const file = files[0];
            setForm((f) => ({ ...f, profile_image: file }));
            setPreview(URL.createObjectURL(file));
        } else {
            setForm((f) => ({ ...f, [name]: value }));

            // 🔹 Validación en tiempo real
            setErrors((prev) => {
                const newErrors = { ...prev };

                if (value.trim() !== "" && newErrors[name]) {
                    delete newErrors[name];
                }

                if (name === "phone") {
                    if (!/^\d{10}$/.test(value)) {
                        newErrors.phone = "Debe tener 10 dígitos numéricos";
                    } else {
                        delete newErrors.phone;
                    }
                }

                if (name === "email") {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value.trim())) {
                        newErrors.email = "Correo inválido";
                    } else {
                        delete newErrors.email;
                    }
                }

                if (name === "confirm_password" || name === "password") {
                    if (
                        (name === "confirm_password" && value !== form.password) ||
                        (name === "password" &&
                            form.confirm_password &&
                            value !== form.confirm_password)
                    ) {
                        newErrors.confirm_password = "Las contraseñas no coinciden";
                    } else {
                        delete newErrors.confirm_password;
                    }
                }

                return newErrors;
            });
        }
    };

    const handleGeneratePassword = () => {
        const pwd = generatePassword(10);
        setForm((f) => ({ ...f, password: pwd, confirm_password: pwd }));
        setPasswordStrength(getPasswordStrength(pwd));
        addToast({
            type: "info",
            title: "Contraseña generada",
            message: "Se creó una contraseña segura automáticamente.",
        });
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            "first_name",
            "last_name",
            "username",
            "email",
            "password",
            "confirm_password",
            "role_id",
            "store_id",
        ];

        requiredFields.forEach((f) => {
            if (!form[f]) newErrors[f] = "Campo obligatorio";
        });

        if (form.password && form.password !== form.confirm_password)
            newErrors.confirm_password = "Las contraseñas no coinciden";

        if (form.phone && !/^\d{10}$/.test(form.phone))
            newErrors.phone = "Debe tener 10 dígitos numéricos";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateAndSubmit = async () => {
        if (!validateForm()) {
            addToast({
                type: "warning",
                title: "Campos incompletos",
                message: "Por favor completa los campos obligatorios.",
            });
            return;
        }
        await handleSubmit();
    };

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const data = new FormData();
            Object.entries(form).forEach(([k, v]) => v && data.append(k, v));

            const res = await createUser(data);
            const newUser = res.user; // ✅ usamos solo el usuario del backend

            addToast({
                type: "success",
                title: "Usuario creado",
                message: `${form.first_name} ${form.last_name} fue agregado correctamente.`,
            });

            handleExit();
            onCreated(newUser);
        } catch (err) {
            addToast({
                type: "error",
                title: "Error al crear usuario",
                message:
                    err.response?.data?.message ||
                    "No se pudo crear el usuario. Verifica los campos o permisos.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExit = () => {
        setForm(initialForm);
        setPreview(null);
        setErrors({});
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
                    className="bg-secondary rounded-2xl shadow-xl border border-slate-700 w-[520px] max-h-[90vh] overflow-y-auto p-6"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-primary">Nuevo Usuario</h2>
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

                    {/* Formulario */}
                    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                        {/* Nombre y Apellido */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2 label-required">Nombre</label>
                                <input
                                    ref={firstRef}
                                    name="first_name"
                                    placeholder="Nombre del usuario"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    className={`input ${errors.first_name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2 label-required">Apellido paterno</label>
                                <input
                                    name="last_name"
                                    placeholder="Apellido paterno"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    className={`input ${errors.last_name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                        </div>

                        {/* Apellido materno */}
                        <div>
                            <label className="block text-sm mb-2">Apellido materno</label>
                            <input
                                name="second_last_name"
                                placeholder="Apellido materno (opcional)"
                                value={form.second_last_name}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        {/* Correo */}
                        <div>
                            <label className="block text-sm mb-2 label-required">Correo electrónico</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="ejemplo@dominio.com"
                                value={form.email}
                                onChange={handleChange}
                                className={`input ${errors.email ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                        </div>

                        {/* Teléfono y Usuario */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2">Teléfono</label>
                                <input
                                    name="phone"
                                    placeholder="+52 555..."
                                    value={form.phone}
                                    onChange={handleChange}
                                    className={`input ${errors.phone ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2 label-required">Usuario</label>
                                <input
                                    name="username"
                                    placeholder="Nombre de usuario"
                                    value={form.username}
                                    onChange={handleChange}
                                    className={`input ${errors.username ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                        </div>

                        {/* Selects */}
                        <FilteredSelect
                            label="Rol"
                            required
                            options={roles}
                            value={form.role_id}
                            onChange={(id) => setForm((f) => ({ ...f, role_id: id }))}
                            error={errors.role_id}
                        />
                        <FilteredSelect
                            label="Tienda"
                            required
                            options={stores}
                            value={form.store_id}
                            onChange={(id) => setForm((f) => ({ ...f, store_id: id }))}
                            error={errors.store_id}
                        />

                        {/* Contraseña */}
                        <div className="relative">
                            <label className="block text-sm mb-2 label-required">Contraseña</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Ingresa una contraseña segura"
                                value={form.password}
                                onChange={handleChange}
                                className={`input pr-24 ${errors.password ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-10 top-[38px] text-slate-400 hover:text-slate-100 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                                type="button"
                                onClick={handleGeneratePassword}
                                className="absolute right-2 top-[38px] text-primary hover:text-sky-400 cursor-pointer"
                            >
                                <KeyRound size={16} />
                            </button>
                        </div>

                        {/* Confirmar contraseña */}
                        <div>
                            <label className="block text-sm mb-2 label-required">Confirmar contraseña</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirm_password"
                                placeholder="Repite la contraseña"
                                value={form.confirm_password}
                                onChange={handleChange}
                                className={`input ${errors.confirm_password ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                        </div>

                        {/* Barra de fuerza */}
                        <div className="h-1 rounded bg-slate-700 overflow-hidden mb-2">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-green-500", "bg-emerald-600"][passwordStrength]
                                }`}
                                style={{ width: `${(passwordStrength / 4) * 100}%` }}
                            ></div>
                        </div>

                        {/* Imagen */}
                        <div className="flex items-center gap-3 mt-2">
                            <label className="cursor-pointer flex items-center gap-2 text-slate-300 hover:text-primary transition">
                                <UploadCloud size={18} />
                                <span>Seleccionar imagen</span>
                                <input
                                    type="file"
                                    name="profile_image"
                                    accept="image/*"
                                    onChange={handleChange}
                                    className="hidden"
                                />
                            </label>
                            {preview && (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                                />
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() =>
                                    Object.values(form).some((v) => v)
                                        ? setConfirmCancel(true)
                                        : handleExit()
                                }
                                className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={validateAndSubmit}
                                disabled={saving}
                                className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Confirmación simple de salida */}
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
