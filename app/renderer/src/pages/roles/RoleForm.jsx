import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ShieldCheck } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";
import * as roleService from "@/services/role.service";

const ACTIONS = [
    { id: "read", label: "Leer" },
    { id: "write", label: "Crear" },
    { id: "edit", label: "Editar" },
    { id: "delete", label: "Eliminar" },
];

export default function RoleForm({ open, onClose, onSaved, itemToEdit = null }) {
    const { addToast } = useToastStore();

    const [availableModules, setAvailableModules] = useState([]);
    const [loadingModules, setLoadingModules] = useState(false);

    const createInitialPermissions = (modules = availableModules) => {
        const perms = {};
        modules.forEach(m => {
            perms[m.id] = { read: false, write: false, edit: false, delete: false };
        });
        return perms;
    };

    const initialForm = {
        name: "",
        permissions: {}
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});

    const firstRef = useRef(null);
    const isEditing = !!itemToEdit;

    useEffect(() => {
        const loadModules = async () => {
            if (!open) return;
            setLoadingModules(true);
            try {
                const modules = await roleService.getPermissions();
                setAvailableModules(modules);
                
                if (itemToEdit) {
                    // Fetch full role details to get complete permissions
                    const fullRole = await roleService.getRoleById(itemToEdit.id);
                    
                    // Asegurarse de que todos los módulos existan en los permisos al editar
                    const emptyPerms = {};
                    modules.forEach(m => {
                        emptyPerms[m.id] = { read: false, write: false, edit: false, delete: false };
                    });

                    const mergedPermissions = { ...emptyPerms };
                    if (fullRole.permissions) {
                        Object.keys(fullRole.permissions).forEach(mId => {
                            if (mergedPermissions[mId]) {
                                mergedPermissions[mId] = { ...mergedPermissions[mId], ...fullRole.permissions[mId] };
                            }
                        });
                    }

                    setForm({
                        ...initialForm,
                        ...fullRole,
                        permissions: mergedPermissions
                    });
                } else {
                    const freshPerms = {};
                    modules.forEach(m => {
                        freshPerms[m.id] = { read: false, write: false, edit: false, delete: false };
                    });
                    setForm({ ...initialForm, permissions: freshPerms });
                }
                setTimeout(() => firstRef.current?.focus(), 50);
            } catch (err) {
                console.error("❌ Error al cargar módulos:", err);
                addToast({
                    type: "error",
                    title: "Error de carga",
                    message: "No se pudieron cargar los módulos de permisos.",
                });
            } finally {
                setLoadingModules(false);
            }
        };

        loadModules();
    }, [open, itemToEdit]);

    // 🎹 Hotkeys
    useHotkeys(
        {
            escape: (e) => {
                if (!open) return;
                e.preventDefault();
                e.stopPropagation();
                if (confirmCancel) return;

                if (form.name) {
                    setConfirmCancel(true);
                } else {
                    handleExit();
                }
                return "prevent";
            },
            enter: (e) => {
                if (!open || confirmCancel) return;
                // No enviamos con ENTER automáticamente aquí porque es un grid complejo
                // Pero si el foco está en el nombre, sí.
                if (document.activeElement === firstRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    const isValid = validateForm();
                    if (isValid) handleSubmit();
                }
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

    const handlePermissionChange = (moduleId, actionId, checked) => {
        setForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleId]: {
                    ...prev.permissions[moduleId],
                    [actionId]: checked
                }
            }
        }));
    };

    const handleToggleAllModule = (moduleId, checked) => {
        setForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleId]: {
                    read: checked,
                    write: checked,
                    edit: checked,
                    delete: checked
                }
            }
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name?.trim()) newErrors.name = "El nombre del rol es obligatorio";

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
            // Transformar permisos para el backend (array de objetos)
            const permissionsArray = Object.keys(form.permissions).map(module => ({
                module,
                ...form.permissions[module]
            }));

            const payload = {
                name: form.name,
                permissions: permissionsArray
            };

            let result;
            if (isEditing) {
                result = await roleService.updateRole(itemToEdit.id, payload);
            } else {
                result = await roleService.createRole(payload);
            }

            addToast({
                type: "success",
                title: isEditing ? "Rol actualizado" : "Rol creado",
                message: `"${form.name}" se guardó correctamente.`,
            });

            onSaved(result.role || result);
            handleExit();
        } catch (err) {
            console.error("❌ Error al guardar rol:", err);
            addToast({
                type: "error",
                title: "Error al guardar",
                message: err.message || "Ocurrió un error inesperado al procesar la solicitud.",
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
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-secondary rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Encabezado */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <ShieldCheck size={24} />
                            </div>
                            <h2 className="text-xl font-semibold text-primary leading-none">
                                {isEditing ? "Editar Rol" : "Nuevo Rol"}
                            </h2>
                        </div>
                        <button
                            onClick={() => (form.name ? setConfirmCancel(true) : handleExit())}
                            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Contenido (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Nombre del Rol */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 label-required text-slate-700 dark:text-slate-300">
                                Nombre del Rol
                            </label>
                            <input
                                ref={firstRef}
                                name="name"
                                placeholder="Ej. Administrador, Recepcionista..."
                                value={form.name}
                                onChange={handleChange}
                                className={`input w-full ${errors.name ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                            {errors.name && <span className="text-xs text-error mt-1">{errors.name}</span>}
                        </div>

                        {/* Grid de Permisos */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                                Configuración de Permisos
                            </h3>

                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-dark/50">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Módulo</th>
                                            {ACTIONS.map(action => (
                                                <th key={action.id} className="px-3 py-3 font-medium text-center text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                                    {action.label}
                                                </th>
                                            ))}
                                            <th className="px-3 py-3 font-medium text-center text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Todos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 relative min-h-[100px]">
                                        {loadingModules ? (
                                            <tr>
                                                <td colSpan={ACTIONS.length + 2} className="px-4 py-8 text-center text-slate-400">
                                                    Cargando módulos...
                                                </td>
                                            </tr>
                                        ) : availableModules.length === 0 ? (
                                            <tr>
                                                <td colSpan={ACTIONS.length + 2} className="px-4 py-8 text-center text-slate-400">
                                                    No hay módulos disponibles.
                                                </td>
                                            </tr>
                                        ) : (
                                            availableModules.map((module) => {
                                                const modulePerms = form.permissions[module.id] || {};
                                                const allChecked = ACTIONS.every(a => modulePerms[a.id]);

                                                return (
                                                    <tr key={module.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                                        <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                                            {module.label}
                                                        </td>
                                                        {ACTIONS.map(action => (
                                                            <td key={action.id} className="px-3 py-2.5 text-center">
                                                                <div className="flex justify-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!modulePerms[action.id]}
                                                                        onChange={(e) => handlePermissionChange(module.id, action.id, e.target.checked)}
                                                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary dark:bg-dark"
                                                                    />
                                                                </div>
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-2.5 text-center">
                                                            <div className="flex justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={allChecked}
                                                                    onChange={(e) => handleToggleAllModule(module.id, e.target.checked)}
                                                                    className="w-4 h-4 rounded-full border-slate-300 dark:border-slate-600 text-primary focus:ring-primary dark:bg-dark bg-slate-100 dark:bg-slate-700 opacity-50 hover:opacity-100 transition"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción (Sticky) */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-dark/20 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => (form.name ? setConfirmCancel(true) : handleExit())}
                            className="px-5 py-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer font-medium text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer font-semibold text-sm shadow-lg shadow-sky-500/20"
                        >
                            {saving ? "Procesando..." : isEditing ? "Actualizar Rol" : "Crear Rol"}
                        </button>
                    </div>
                </motion.div>
            </div>

            <ConfirmDialog
                open={confirmCancel}
                title="Descartar cambios"
                message="¿Estás seguro de que deseas salir? Perderás la configuración de este rol."
                onConfirm={() => {
                    setConfirmCancel(false);
                    handleExit();
                }}
                onCancel={() => {
                    setConfirmCancel(false);
                }}
                confirmLabel="Sí, descartar"
                cancelLabel="Seguir editando"
                confirmVariant="warning"
            />
        </>,
        document.body
    );
}
