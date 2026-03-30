import { useState, useEffect, useRef } from "react";
import { useToastStore } from "@/store/useToastStore";
import { Modal } from "@/components/ui";
import { ConfirmDialog } from "@/components/feedback";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { getRoles } from "@/services/role.service";

/**
 * ⚠️ TEMPORAL - MOCK STORAGE
 * Los datos de usuario se almacenan en localStorage.
 * Debe reemplazarse por llamadas al backend cuando esté disponible.
 */

const STATUS_LABELS = {
    active: "Activo",
    inactive: "Inactivo",
    blocked: "Bloqueado",
};

const initialForm = {
    username: "",
    password: "",
    confirm_password: "",
    status: "active",
    role_id: "",
};

const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const getPasswordStrength = (password) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
};

const STRENGTH_LABELS = ["Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"];
const STRENGTH_COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-green-500", "bg-emerald-600"];

export default function EmployeeUserModal({ open, onClose, employee, onSave }) {
    const { addToast } = useToastStore();
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [roles, setRoles] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const firstRef = useRef(null);

    const isEditing = !!employee?.user_account;
    const passwordStrength = getPasswordStrength(form.password);

    useEffect(() => {
        if (open) {
            setErrors({});
            setShowPassword(false);
            if (isEditing) {
                // Load existing user account data (without password)
                setForm({
                    username: employee.user_account.username || "",
                    password: "",
                    confirm_password: "",
                    status: employee.user_account.status || "active",
                    role_id: employee.user_account.role_id || "",
                });
            } else {
                setForm(initialForm);
            }
            setTimeout(() => firstRef.current?.focus(), 100);

            const loadRoles = async () => {
                setIsLoadingRoles(true);
                try {
                    const data = await getRoles();
                    setRoles(data);
                } catch (err) {
                    addToast({ type: "error", title: "Error", message: "No se pudieron cargar los roles." });
                } finally {
                    setIsLoadingRoles(false);
                }
            };
            loadRoles();
        }
    }, [open, employee, isEditing, addToast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleGeneratePassword = () => {
        const pwd = generatePassword();
        setForm((f) => ({ ...f, password: pwd, confirm_password: pwd }));
        setShowPassword(true);
    };

    const hasChanges = () => {
        if (!isEditing) {
            return form.username.trim() !== "" || form.password !== "" || form.status !== "active";
        }
        const orig = employee.user_account;
        return form.username !== orig.username || form.status !== orig.status || form.password !== "";
    };

    const validate = () => {
        const errs = {};
        if (!form.username.trim()) errs.username = "Campo obligatorio";
        if (!form.role_id) errs.role_id = "Debes seleccionar un rol";
        if (!isEditing && !form.password) errs.password = "Campo obligatorio";
        if (form.password && form.password.length < 6) errs.password = "Mínimo 6 caracteres";
        if (form.password && form.password !== form.confirm_password) {
            errs.confirm_password = "Las contraseñas no coinciden";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = () => {
        if (!validate()) {
            addToast({ type: "warning", title: "Campos inválidos", message: "Por favor revisa los campos marcados." });
            return;
        }

        const userAccount = {
            username: form.username.trim(),
            status: form.status,
            role_id: form.role_id,
            // Only update password if a new one was entered
            ...(form.password ? { password: form.password } : isEditing ? { password: employee.user_account.password } : {}),
            created_at: isEditing ? employee.user_account.created_at : new Date().toISOString(),
        };

        onSave(userAccount);

        addToast({
            type: "success",
            title: isEditing ? "Usuario actualizado" : "Usuario creado",
            message: `La cuenta de usuario para ${employee?.first_name} fue ${isEditing ? "actualizada" : "creada"} correctamente.`,
        });

        handleExit();
    };

    const handleAttemptClose = () => {
        if (hasChanges()) {
            setConfirmCancel(true);
        } else {
            handleExit();
        }
    };

    const handleExit = () => {
        setForm(initialForm);
        setErrors({});
        onClose();
    };

    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : "";

    return (
        <>
            <Modal
                open={open}
                onClose={handleAttemptClose}
                title={isEditing ? `Usuario de ${employeeName}` : `Crear usuario para ${employeeName}`}
                widthClass="w-[460px]"
            >
                <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>

                    {/* Username */}
                    <div>
                        <label className="block text-sm mb-2 text-slate-300">
                            Nombre de usuario <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={firstRef}
                            name="username"
                            placeholder="usuario123"
                            value={form.username}
                            onChange={handleChange}
                            autoComplete="off"
                            className={`input ${errors.username ? "border-error ring-1 ring-error/50" : ""}`}
                        />
                        {errors.username && <p className="text-xs text-error mt-1">{errors.username}</p>}
                    </div>

                    {/* Estatus */}
                    <div>
                        <label className="block text-sm mb-2 text-slate-300">Estatus</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="input bg-secondary text-slate-200"
                        >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-700/60 my-1" />

                    {/* Rol */}
                    <div>
                        <label className="block text-sm mb-2 text-slate-300">
                            Rol <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="role_id"
                            value={form.role_id}
                            onChange={handleChange}
                            disabled={isLoadingRoles}
                            className={`input ${errors.role_id ? "border-error ring-1 ring-error/50" : "bg-secondary text-slate-200"}`}
                        >
                            <option value="">{isLoadingRoles ? "Cargando roles..." : "Selecciona un rol"}</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        {errors.role_id && <p className="text-xs text-error mt-1">{errors.role_id}</p>}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-700/60 my-1" />

                    {/* Contraseña */}
                    <div className="relative">
                        <label className="block text-sm mb-2 text-slate-300">
                            Contraseña {!isEditing && <span className="text-red-500">*</span>}
                            {isEditing && <span className="text-slate-500 text-xs ml-1">(dejar vacío para mantener)</span>}
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder={isEditing ? "Nueva contraseña (opcional)" : "Ingresa una contraseña segura"}
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="new-password"
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
                            title="Generar contraseña"
                        >
                            <KeyRound size={16} />
                        </button>
                        {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirmar contraseña */}
                    <div>
                        <label className="block text-sm mb-2 text-slate-300">Confirmar contraseña</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirm_password"
                            placeholder="Repite la contraseña"
                            value={form.confirm_password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            className={`input ${errors.confirm_password ? "border-error ring-1 ring-error/50" : ""}`}
                        />
                        {errors.confirm_password && <p className="text-xs text-error mt-1">{errors.confirm_password}</p>}
                    </div>

                    {/* Barra de fuerza */}
                    {form.password && (
                        <>
                            <div className="h-1 rounded bg-slate-700 overflow-hidden -mt-2">
                                <div
                                    className={`h-full transition-all duration-300 ${STRENGTH_COLORS[passwordStrength]}`}
                                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 -mt-2">
                                Fortaleza: <span className="font-semibold text-slate-300">{STRENGTH_LABELS[passwordStrength]}</span>
                            </p>
                        </>
                    )}

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-700/50">
                        <button
                            type="button"
                            onClick={handleAttemptClose}
                            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition cursor-pointer text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition cursor-pointer text-sm font-medium shadow-lg shadow-primary/20"
                        >
                            {isEditing ? "Guardar cambios" : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar"
                message="¿Deseas salir sin guardar los cambios?"
                onConfirm={() => { setConfirmCancel(false); handleExit(); }}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </>
    );
}
