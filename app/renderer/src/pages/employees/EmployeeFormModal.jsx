import { useState, useEffect, useRef } from "react";
import { useToastStore } from "@/store/useToastStore";
import { X, UploadCloud } from "lucide-react";
import { Modal } from "@/components/ui";
import { ConfirmDialog } from "@/components/feedback";
import api from "@/services/api";

/**
 * ⚠️ TEMPORAL - MOCK FORM LOGIC
 * Este modal maneja lógica de guardado local (Mock) para simular persistencia.
 * 
 * 📌 IMPORTANTE:
 * - Debe reemplazarse la llamada a onSave/ID generation por peticiones al backend.
 * - Este componente es agnóstico a la persistencia (se encarga el padre o servicio).
 */

const initialForm = {
    first_name: "",
    last_name: "",
    second_last_name: "",
    email: "",
    phone: "",
    position: "",
    is_appointment_eligible: false,
    status: "active",
    profile_image: null,
    hiring_date: "",
    roleIds: [],
};

export default function EmployeeFormModal({ open, onClose, employee, onSave }) {
    const { addToast } = useToastStore();
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [preview, setPreview] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [rolesList, setRolesList] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const firstRef = useRef(null);

    // Initialize form with employee data if editing
    useEffect(() => {
        if (open) {
            if (employee) {
                // Si viene de mock storage, podría no tener roleIds
                setForm({
                    ...employee,
                    roleIds: employee.roleIds || (employee.roles ? employee.roles.map(r => r.id) : [])
                });
                setPreview(employee.profile_image);
            } else {
                setForm(initialForm);
                setPreview(null);
            }
            fetchRoles();
            setTimeout(() => firstRef.current?.focus(), 100);
        }
    }, [open, employee]);

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const response = await api.get("/roles");
            setRolesList(response.data);
        } catch (error) {
            console.error("Error fetching roles:", error);
            addToast({
                type: "error",
                title: "Error",
                message: "No se pudieron cargar los roles.",
            });
        } finally {
            setLoadingRoles(false);
        }
    };

    const hasFormChanges = () => {
        if (!employee) {
            return Object.entries(form).some(([k, v]) => {
                if (typeof v === "boolean") return v !== initialForm[k];
                if (k === "status") return v !== initialForm[k];
                return String(v || "").trim() !== "";
            });
        }
        return JSON.stringify(form) !== JSON.stringify(employee);
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (name === "profile_image" && files?.[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setForm((f) => ({ ...f, profile_image: base64String }));
                setPreview(base64String);
            };
            reader.readAsDataURL(file);
            return;
        }

        const val = type === "checkbox" ? checked : value;

        setForm((f) => ({ ...f, [name]: val }));

        // Real-time validation
        setErrors((prev) => {
            const newErrors = { ...prev };
            if (type !== "checkbox" && String(val).trim() !== "" && newErrors[name]) {
                delete newErrors[name];
            }
            return newErrors;
        });
    };

    const handleRoleChange = (roleId) => {
        setForm(prev => {
            const currentRoleIds = prev.roleIds || [];
            const newRoleIds = currentRoleIds.includes(roleId)
                ? currentRoleIds.filter(id => id !== roleId)
                : [...currentRoleIds, roleId];
            return { ...prev, roleIds: newRoleIds };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.first_name?.trim()) newErrors.first_name = "Campo obligatorio";
        if (!form.last_name?.trim()) newErrors.last_name = "Campo obligatorio";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) {
            addToast({
                type: "warning",
                title: "Campos incompletos",
                message: "Por favor completa los campos obligatorios.",
            });
            return;
        }

        const newEmployee = { ...form };
        if (!newEmployee.id) {
            newEmployee.id = Date.now(); // Mock ID
        }

        onSave(newEmployee);
        addToast({
            type: "success",
            title: employee ? "Empleado actualizado" : "Empleado creado",
            message: `${form.first_name} ${form.last_name} fue guardado correctamente.`,
        });

        handleExit();
    };

    const handleAttemptClose = () => {
        if (hasFormChanges()) {
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

    return (
        <>
            <Modal
                open={open}
                onClose={handleAttemptClose}
                title={employee ? "Editar Empleado" : "Nuevo Empleado"}
                widthClass="w-[500px]"
            >
                <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                    {/* Nombre y Apellido Paterno */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={firstRef}
                                name="first_name"
                                placeholder="Nombre(s)"
                                value={form.first_name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition ${errors.first_name ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Apellido paterno <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="last_name"
                                placeholder="Apellido paterno"
                                value={form.last_name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition ${errors.last_name ? "border-error ring-1 ring-error/50" : ""}`}
                            />
                        </div>
                    </div>

                    {/* Apellido Materno */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Apellido materno</label>
                        <input
                            name="second_last_name"
                            placeholder="Apellido materno (opcional)"
                            value={form.second_last_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition"
                        />
                    </div>

                    {/* Correo y Teléfono */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Correo electrónico</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="ejemplo@dominio.com"
                                value={form.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono</label>
                            <input
                                name="phone"
                                placeholder="10 dígitos"
                                value={form.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition"
                            />
                        </div>
                    </div>

                    {/* Puesto y Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Puesto</label>
                            <input
                                name="position"
                                placeholder="Ej: Dentista, Asistente..."
                                value={form.position}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition"
                            >
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    {/* Fecha de Contratación */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de contratación</label>
                        <input
                            name="hiring_date"
                            type="date"
                            value={form.hiring_date || ""}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition"
                        />
                    </div>

                    {/* Imagen de Perfil */}
                    <div className="flex flex-col items-center gap-3 py-4 bg-slate-50 dark:bg-slate-800/10 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-inner flex items-center justify-center">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <UploadCloud size={32} className="text-slate-400" />
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Cambiar</span>
                                <input
                                    type="file"
                                    name="profile_image"
                                    accept="image/*"
                                    onChange={handleChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Imagen de perfil</p>
                    </div>

                    {/* Roles del Empleado */}
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Roles del empleado
                            {loadingRoles && <span className="loading loading-spinner loading-xs text-primary"></span>}
                        </h4>

                        {rolesList.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {rolesList.map((role) => (
                                    <div key={role.id} className="flex items-center gap-3 group">
                                        <input
                                            type="checkbox"
                                            id={`role-${role.id}`}
                                            checked={form.roleIds?.includes(role.id)}
                                            onChange={() => handleRoleChange(role.id)}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-secondary text-primary focus:ring-primary accent-primary cursor-pointer transition"
                                        />
                                        <label htmlFor={`role-${role.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none group-hover:text-primary transition">
                                            {role.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        ) : !loadingRoles && (
                            <p className="text-xs text-slate-500 italic">No hay roles disponibles.</p>
                        )}
                    </div>

                    {/* Citas */}
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="is_appointment_eligible"
                            name="is_appointment_eligible"
                            checked={form.is_appointment_eligible}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-slate-700 bg-secondary text-primary accent-primary cursor-pointer"
                        />
                        <label htmlFor="is_appointment_eligible" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                            Es elegible para citas / atiende pacientes
                        </label>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleAttemptClose}
                            className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-6 py-2.5 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-cyan-600/40"
                        >
                            {employee ? "Guardar cambios" : "Crear empleado"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirmación simple de salida */}
            <ConfirmDialog
                open={confirmCancel}
                title={employee ? "Cancelar edición" : "Cancelar registro"}
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
        </>
    );
}
