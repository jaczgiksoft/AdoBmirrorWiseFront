import { useState, useEffect, useRef } from "react";
import { useToastStore } from "@/store/useToastStore";
import { X, UploadCloud, Briefcase, Shield, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { ConfirmDialog } from "@/components/feedback";
import { getRoles } from "@/services/role.service";
import { getPositions } from "@/services/position.service";

const initialForm = {
    first_name: "",
    last_name: "",
    second_last_name: "",
    email: "",
    phone: "",
    role_id: "",
    positionIds: [],
    is_appointment_eligible: false,
    status: "active",
    profile_image: null,
};

export default function EmployeeFormModal({ open, onClose, employee, onSave }) {
    const { addToast } = useToastStore();
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [preview, setPreview] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState(false);
    
    const [rolesList, setRolesList] = useState([]);
    const [positionsList, setPositionsList] = useState([]);
    const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
    
    const firstRef = useRef(null);

    // Initial load
    useEffect(() => {
        if (open) {
            fetchCatalogs();
            if (employee) {
                setForm({
                    first_name: employee.first_name || "",
                    last_name: employee.last_name || "",
                    second_last_name: employee.second_last_name || "",
                    email: employee.email || "",
                    phone: employee.phone || "",
                    role_id: employee.role_id || (employee.role?.id) || "",
                    positionIds: employee.positionIds || (employee.positions?.map(p => p.id)) || [],
                    is_appointment_eligible: !!employee.is_appointment_eligible,
                    status: employee.status || "active",
                    profile_image: employee.profile_image || null,
                });
                setPreview(employee.profile_image);
            } else {
                setForm(initialForm);
                setPreview(null);
            }
            setTimeout(() => firstRef.current?.focus(), 100);
        }
    }, [open, employee]);

    const fetchCatalogs = async () => {
        setIsLoadingCatalogs(true);
        try {
            const [roles, positions] = await Promise.all([
                getRoles(),
                getPositions()
            ]);
            setRolesList(roles);
            setPositionsList(positions);
        } catch (error) {
            console.error("Error fetching catalogs:", error);
            addToast({
                type: "error",
                title: "Error",
                message: "No se pudieron cargar los roles o puestos.",
            });
        } finally {
            setIsLoadingCatalogs(false);
        }
    };

    const hasFormChanges = () => {
        if (!employee) {
            return Object.entries(form).some(([k, v]) => {
                if (k === "positionIds") return v.length > 0;
                if (typeof v === "boolean") return v !== initialForm[k];
                if (k === "status") return v !== initialForm[k];
                return String(v || "").trim() !== "";
            });
        }
        // Comparison for edit mode
        const currentData = {
            ...form,
            role_id: Number(form.role_id),
            positionIds: [...form.positionIds].sort()
        };
        const originalData = {
            first_name: employee.first_name || "",
            last_name: employee.last_name || "",
            second_last_name: employee.second_last_name || "",
            email: employee.email || "",
            phone: employee.phone || "",
            role_id: employee.role_id || (employee.role?.id) || "",
            positionIds: (employee.positions?.map(p => p.id) || []).sort(),
            is_appointment_eligible: !!employee.is_appointment_eligible,
            status: employee.status || "active",
            profile_image: employee.profile_image || null,
        };
        return JSON.stringify(currentData) !== JSON.stringify(originalData);
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
            if (newErrors[name]) delete newErrors[name];
            return newErrors;
        });
    };

    const handlePositionToggle = (id) => {
        setForm(prev => {
            const current = prev.positionIds || [];
            const updated = current.includes(id)
                ? current.filter(pid => pid !== id)
                : [...current, id];
            
            // Clear positionIds error if any
            if (updated.length > 0 && errors.positionIds) {
                setErrors(e => {
                    const next = {...e};
                    delete next.positionIds;
                    return next;
                });
            }
            
            return { ...prev, positionIds: updated };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.first_name?.trim()) newErrors.first_name = "Campo obligatorio";
        if (!form.last_name?.trim()) newErrors.last_name = "Campo obligatorio";
        if (!form.role_id) newErrors.role_id = "Debes asignar un rol";
        if (!form.positionIds || form.positionIds.length === 0) {
            newErrors.positionIds = "Debes seleccionar al menos un puesto";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) {
            addToast({
                type: "warning",
                title: "Campos incompletos",
                message: "Por favor revisa los campos obligatorios.",
            });
            return;
        }

        onSave(form);
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
                widthClass="w-[540px]"
            >
                <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                    
                    {/* Sección: Datos Personales */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre <span className="text-rose-500">*</span></label>
                            <input
                                ref={firstRef}
                                name="first_name"
                                placeholder="Nombre(s)"
                                value={form.first_name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition ${errors.first_name ? "border-rose-500 ring-1 ring-rose-500/50" : ""}`}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apellido paterno <span className="text-rose-500">*</span></label>
                            <input
                                name="last_name"
                                placeholder="Apellido paterno"
                                value={form.last_name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition ${errors.last_name ? "border-rose-500 ring-1 ring-rose-500/50" : ""}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Correo electrónico</label>
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
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                            <input
                                name="phone"
                                placeholder="10 dígitos"
                                value={form.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition"
                            />
                        </div>
                    </div>

                    {/* Sección: Organización (Rol y Estado) */}
                    <div className="p-4 bg-slate-100/50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                <Shield size={12} className="text-primary" />
                                Rol Asignado <span className="text-rose-500">*</span>
                            </label>
                            <select
                                name="role_id"
                                value={form.role_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-white dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition ${errors.role_id ? "border-rose-500 ring-1 ring-rose-500/50" : ""}`}
                            >
                                <option value="">Seleccionar rol...</option>
                                {rolesList.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estado</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-white dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white transition"
                            >
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    {/* Sección: Puestos (Multi-selección) */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <Briefcase size={12} className="text-primary" />
                            Puestos de Trabajo <span className="text-rose-500">*</span>
                        </label>
                        <div className={`grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border transition ${errors.positionIds ? "border-rose-500" : "border-slate-200 dark:border-slate-800"}`}>
                            {positionsList.map(pos => {
                                const isSelected = form.positionIds.includes(pos.id);
                                return (
                                    <button
                                        key={pos.id}
                                        type="button"
                                        onClick={() => handlePositionToggle(pos.id)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                            isSelected 
                                            ? "bg-primary/10 border-primary text-primary shadow-sm ring-1 ring-primary/20" 
                                            : "bg-white dark:bg-secondary border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
                                        }`}
                                    >
                                        <span className="truncate mr-2">{pos.name}</span>
                                        {isSelected && <CheckCircle2 size={14} />}
                                    </button>
                                );
                            })}
                            {positionsList.length === 0 && !isLoadingCatalogs && (
                                <p className="col-span-2 text-center py-2 text-xs text-slate-400 italic">No hay puestos configurados</p>
                            )}
                        </div>
                        {errors.positionIds && <p className="text-[10px] text-rose-500 font-medium ml-1">{errors.positionIds}</p>}
                    </div>

                    {/* Imagen de Perfil e Interacción */}
                    <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                        <div className="relative group w-24 h-24 mx-auto">
                            <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <UploadCloud size={32} className="text-slate-400" />
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Cambiar</span>
                                <input type="file" name="profile_image" accept="image/*" onChange={handleChange} className="hidden" />
                            </label>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 p-3 bg-sky-500/5 rounded-xl border border-sky-500/10">
                                <input
                                    type="checkbox"
                                    id="is_appointment_eligible"
                                    name="is_appointment_eligible"
                                    checked={form.is_appointment_eligible}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-slate-400 bg-white dark:bg-secondary text-primary accent-primary cursor-pointer transition-transform active:scale-90"
                                />
                                <label htmlFor="is_appointment_eligible" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    Atiende pacientes y es elegible para citas agendadas.
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleAttemptClose}
                            className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-7 py-2.5 rounded-lg font-bold bg-primary hover:bg-sky-500 text-white shadow-lg shadow-primary/20 transition active:scale-95 flex items-center gap-2"
                        >
                            {employee ? "Guardar cambios" : "Crear empleado"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={confirmCancel}
                title={employee ? "Cancelar edición" : "Cancelar registro"}
                message="¿Deseas salir sin guardar los cambios? Se perderán los datos ingresados."
                onConfirm={() => { setConfirmCancel(false); handleExit(); }}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </>
    );
}
