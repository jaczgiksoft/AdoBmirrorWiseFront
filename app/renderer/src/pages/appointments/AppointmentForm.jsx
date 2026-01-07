import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRight, ArrowLeft, GripVertical, Clock, Plus, Trash2, Edit2, Save, Search, User, Calendar, Stethoscope, FileText, DollarSign, Timer } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { createAppointment, updateAppointment } from "@/services/appointment.service";
import { getPatients } from "@/services/patient.service";
import { getClinicAreas } from "@/services/clinic_area.service";
import { getDoctors } from "@/services/employee.service";
import { getAllServices } from "@/services/service.service";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";

// DnD Imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- MOCK DATA ---
const INITIAL_STEPS = [
    { id: 1, name: "Anesthesia", duration_minutes: 15 },
    { id: 2, name: "Cleaning", duration_minutes: 20 },
    { id: 3, name: "Drilling", duration_minutes: 30 },
    { id: 4, name: "Filling", duration_minutes: 20 },
    { id: 5, name: "Polishing", duration_minutes: 10 },
    { id: 6, name: "X-Ray", duration_minutes: 10 },
    { id: 7, name: "Consultation", duration_minutes: 15 },
];

const INITIAL_PROCESSES = [
    {
        id: 1,
        name: "Standard Cleaning",
        steps: [
            { id: "s1", step_id: 1, duration_override: 10 }, // Anesthesia
            { id: "s2", step_id: 2, duration_override: null }, // Cleaning
            { id: "s3", step_id: 5, duration_override: null }  // Polishing
        ]
    },
    {
        id: 2,
        name: "Cavity Filling",
        steps: [
            { id: "s4", step_id: 1, duration_override: 15 },
            { id: "s5", step_id: 3, duration_override: null },
            { id: "s6", step_id: 4, duration_override: null },
            { id: "s7", step_id: 5, duration_override: 5 }
        ]
    }
];

// Helper to add minutes to HH:mm string
const addMinutes = (timeStr, minutes) => {
    if (!timeStr) return "00:00";
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
};

// Helper to get duration in minutes between two HH:mm strings
const getDuration = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    const [h1, m1] = startStr.split(':').map(Number);
    const [h2, m2] = endStr.split(':').map(Number);
    const d1 = new Date(); d1.setHours(h1, m1, 0, 0);
    const d2 = new Date(); d2.setHours(h2, m2, 0, 0);
    return Math.max(0, (d2 - d1) / 60000);
};

// --- DnD Sortable Item Component ---
function SortableStepItem({ pStep, stepDef, onChangeDuration, onRemove }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pStep.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const effectiveDuration = pStep.duration_override !== null ? pStep.duration_override : stepDef?.duration_minutes;

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600 shadow-sm group select-none relative z-10">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:text-slate-700 text-slate-400 p-1 outline-none">
                <GripVertical size={16} />
            </div>
            <div className="bg-slate-100 dark:bg-slate-600 p-1.5 rounded text-slate-500 shrink-0"><Clock size={14} /></div>
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium truncate" title={stepDef?.name}>{stepDef?.name || "Paso desconocido"}</span>
            <input
                type="number"
                className="w-16 h-7 text-xs border border-slate-200 rounded px-2 dark:bg-slate-800 dark:border-slate-600 text-right focus:border-primary outline-none"
                placeholder={stepDef?.duration_minutes}
                value={pStep.duration_override !== null ? pStep.duration_override : ""}
                onChange={(e) => {
                    const val = e.target.value === "" ? null : parseInt(e.target.value);
                    onChangeDuration(val);
                }}
                onKeyDown={(e) => e.stopPropagation()} // Prevent DnD interference
            />
            <span className="text-xs text-slate-400 w-6">min</span>
            <button onClick={onRemove} className="text-slate-400 hover:text-error ml-2 p-1 transition-colors"><X size={14} /></button>
        </div>
    );
}

export default function AppointmentForm({ open, onClose, onSaved, itemToEdit = null }) {
    const { addToast } = useToastStore();
    const isEditing = !!itemToEdit;

    const [hasChanges, setHasChanges] = useState(false);

    // --- Steps Definition ---
    const [step, setStep] = useState(1);

    const initialForm = {
        patient_id: "",
        employee_id: "", // Doctor
        clinic_area_id: "",
        date: new Date().toISOString().split("T")[0],
        start_time: "09:00",
        end_time: "09:30",
        duration_minutes: 30, // Persisted duration
        unit_value: 15,
        units: 1,
        status: "pendiente",
        notes: "",
        total_amount: 0
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});

    // Select options
    const [patients, setPatients] = useState([]);
    const [clinicAreas, setClinicAreas] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);

    // Services Logic
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [serviceSearch, setServiceSearch] = useState("");

    // --- PROCESS LOGIC STATS ---
    const [availableSteps, setAvailableSteps] = useState(INITIAL_STEPS);
    const [availableProcesses, setAvailableProcesses] = useState(INITIAL_PROCESSES);
    const [selectedProcessId, setSelectedProcessId] = useState(""); // "" or ID

    // UI States for Step 3
    const [isCreatingProcess, setIsCreatingProcess] = useState(false);
    const [addingStepsTargetId, setAddingStepsTargetId] = useState(null); // null, "new", or processId
    const [isCreatingStep, setIsCreatingStep] = useState(false);

    // New Process Form
    const [newProcessName, setNewProcessName] = useState("");
    const [newProcessSteps, setNewProcessSteps] = useState([]);

    // Add Steps Modal State
    const [stepsToAdd, setStepsToAdd] = useState([]); // Array of IDs to add
    const [stepSearch, setStepSearch] = useState("");

    // New Step Form
    const [newStepName, setNewStepName] = useState("");
    const [newStepDuration, setNewStepDuration] = useState(15);

    const firstRef = useRef(null);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (!open) return;
        setStep(1);
        setHasChanges(false);
        async function loadData() {
            try { const p = await getPatients(); setPatients(Array.isArray(p) ? p : []); } catch (e) { }
            try { const c = await getClinicAreas(); setClinicAreas(Array.isArray(c) ? c : (c?.data || [])); } catch (e) { }
            try { const d = await getDoctors(); setDoctors(Array.isArray(d) ? d : []); } catch (e) { }
            try { const s = await getAllServices(); setServices(Array.isArray(s) ? s : []); } catch (e) { }
        }
        loadData();

        if (itemToEdit) {
            const initialDuration = getDuration(itemToEdit.start_time || "09:00", itemToEdit.end_time || "09:30");
            setForm({
                ...initialForm,
                ...itemToEdit,
                duration_minutes: initialDuration,
                patient_id: itemToEdit.patient_id || "",
                employee_id: itemToEdit.employee_id || "",
                clinic_area_id: itemToEdit.clinic_area_id || "",
            });
            setSelectedProcessId("");
        } else {
            setForm(initialForm);
            setSelectedServiceIds([]);
            setSelectedProcessId("");
        }
        setTimeout(() => firstRef.current?.focus(), 50);
    }, [open, itemToEdit]);

    // --- HELPER: Calculate Process Duration ---
    const calculateProcessDuration = (processId) => {
        const process = availableProcesses.find(p => p.id === processId);
        if (!process) return 0;
        return process.steps.reduce((acc, pStep) => {
            const stepDef = availableSteps.find(s => s.id === pStep.step_id);
            if (!stepDef) return acc;
            const duration = pStep.duration_override !== null ? pStep.duration_override : stepDef.duration_minutes;
            return acc + parseInt(duration || 0);
        }, 0);
    };

    // --- RECALCULATION & SYNC LOGIC ---
    useEffect(() => {
        if (!open) return;
        let servicesTotal = 0;
        let servicesDuration = 0;
        let servicesUnits = 0;

        selectedServiceIds.forEach(id => {
            const svc = services.find(s => s.id === id);
            if (svc) {
                servicesTotal += parseFloat(svc.price) || 0;
                servicesDuration += parseInt(svc.duration_minutes) || 0;
                servicesUnits += parseFloat(svc.suggested_units) || 0;
            }
        });

        let finalDuration = servicesDuration;
        if (selectedProcessId) {
            const pDuration = calculateProcessDuration(selectedProcessId);
            if (pDuration > 0) finalDuration = pDuration;
        }

        setForm(prev => {
            const nextEndTime = addMinutes(prev.start_time, finalDuration);
            return {
                ...prev,
                total_amount: servicesTotal > 0 ? servicesTotal : prev.total_amount,
                duration_minutes: finalDuration,
                units: servicesUnits,
                end_time: nextEndTime
            };
        });
    }, [selectedServiceIds, services, selectedProcessId, availableProcesses, availableSteps]);


    useHotkeys({
        escape: (e) => {
            if (!open) return;
            e.preventDefault();
            if (confirmCancel) return;
            if (hasChanges) setConfirmCancel(true); else handleExit();
        },
        enter: (e) => {
            if (!open || confirmCancel) return;
            if (step === 4) { e.preventDefault(); if (!saving) handleSubmit(); }
        },
    }, [open, form, confirmCancel, step, saving, hasChanges]);

    const handleChange = (e) => {
        setHasChanges(true); // Dirty check
        const { name, value } = e.target;
        setForm((prev) => {
            const newData = { ...prev, [name]: value };
            if (name === "duration_minutes") newData.end_time = addMinutes(prev.start_time, parseInt(value) || 0);
            if (name === "start_time") newData.end_time = addMinutes(value, parseInt(prev.duration_minutes) || 0);
            if (name === "end_time") newData.duration_minutes = getDuration(prev.start_time, value);
            return newData;
        });
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    // --- Services Helpers ---
    const toggleService = (id) => {
        setHasChanges(true);
        setSelectedServiceIds(prev => {
            const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            if (next.length === 0) {
                setForm(f => ({
                    ...f, total_amount: 0,
                    duration_minutes: selectedProcessId ? calculateProcessDuration(selectedProcessId) : 0,
                    units: 0,
                    end_time: addMinutes(f.start_time, selectedProcessId ? calculateProcessDuration(selectedProcessId) : 0)
                }));
            }
            return next;
        });
    };
    const handleClearServices = () => {
        setHasChanges(true);
        setSelectedServiceIds([]);
        const pDuration = selectedProcessId ? calculateProcessDuration(selectedProcessId) : 0;
        setForm(prev => ({ ...prev, total_amount: 0, duration_minutes: pDuration, units: 0, end_time: addMinutes(prev.start_time, pDuration) }));
    };


    // --- STEP 3 DnD HANDLERS ---
    const handleDragEnd = (event) => {
        setHasChanges(true);
        const { active, over } = event;
        if (!over) return;
        if (active.id !== over.id) {
            if (isCreatingProcess) {
                setNewProcessSteps((items) => {
                    const oldIndex = items.findIndex((i) => i.id === active.id);
                    const newIndex = items.findIndex((i) => i.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
            } else if (selectedProcessId) {
                setAvailableProcesses(prev => prev.map(proc => {
                    if (proc.id !== selectedProcessId) return proc;
                    const items = proc.steps;
                    const oldIndex = items.findIndex((i) => i.id === active.id);
                    const newIndex = items.findIndex((i) => i.id === over.id);
                    return { ...proc, steps: arrayMove(items, oldIndex, newIndex) };
                }));
            }
        }
    };

    // --- GENERIC LIST ACTIONS ---
    const confirmAddSteps = () => {
        if (!addingStepsTargetId) return;
        setHasChanges(true);
        if (stepsToAdd.length === 0) {
            setAddingStepsTargetId(null);
            return;
        }

        const newStepObjs = stepsToAdd.map(stepId => ({
            id: `s-${Date.now()}-${stepId}-${Math.random().toString(36).substr(2, 5)}`,
            step_id: stepId,
            duration_override: null
        }));

        if (addingStepsTargetId === "new") {
            setNewProcessSteps(prev => [...prev, ...newStepObjs]);
        } else {
            setAvailableProcesses(prev => prev.map(proc => {
                if (proc.id !== addingStepsTargetId) return proc;
                return { ...proc, steps: [...proc.steps, ...newStepObjs] };
            }));
        }

        // Reset
        setStepsToAdd([]);
        setStepSearch("");
        setAddingStepsTargetId(null);
    };

    const toggleStepSelection = (stepId) => {
        setStepsToAdd(prev => prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]);
    };

    const removeStepFromProcess = (targetProcessId, stepInstanceId) => {
        setHasChanges(true);
        if (targetProcessId === "new") {
            setNewProcessSteps(prev => prev.filter(s => s.id !== stepInstanceId));
        } else {
            setAvailableProcesses(prev => prev.map(proc => {
                if (proc.id !== targetProcessId) return proc;
                return { ...proc, steps: proc.steps.filter(s => s.id !== stepInstanceId) };
            }));
        }
    };

    const updateStepDuration = (targetProcessId, stepInstanceId, duration) => {
        setHasChanges(true);
        if (targetProcessId === "new") {
            setNewProcessSteps(prev => prev.map(s => s.id === stepInstanceId ? { ...s, duration_override: duration } : s));
        } else {
            setAvailableProcesses(prev => prev.map(proc => {
                if (proc.id !== targetProcessId) return proc;
                return { ...proc, steps: proc.steps.map(s => s.id === stepInstanceId ? { ...s, duration_override: duration } : s) };
            }));
        }
    };


    const handleSaveNewProcess = () => {
        setHasChanges(true);
        if (!newProcessName.trim()) return;
        const newProc = { id: Date.now(), name: newProcessName, steps: newProcessSteps };
        setAvailableProcesses(prev => [...prev, newProc]);
        setSelectedProcessId(newProc.id);
        setIsCreatingProcess(false);
        setNewProcessName("");
        setNewProcessSteps([]);
    };

    const handleSaveNewStep = () => {
        if (!newStepName.trim()) return;
        const newStep = { id: Date.now(), name: newStepName, duration_minutes: parseInt(newStepDuration) || 15 };
        setAvailableSteps(prev => [...prev, newStep]);
        setIsCreatingStep(false);
        setNewStepName("");
        setNewStepDuration(15);
    };

    // Navigation and Submit Handlers
    const validateStep1 = () => {
        const newErrors = {};
        if (!form.patient_id) newErrors.patient_id = "El paciente es obligatorio";
        if (!form.employee_id) newErrors.employee_id = "El doctor es obligatorio";
        if (!form.clinic_area_id) newErrors.clinic_area_id = "El área es obligatoria";
        if (!form.date) newErrors.date = "La fecha es obligatoria";
        if (!form.start_time) newErrors.start_time = "La hora inicio es obligatoria";
        if (!form.end_time) newErrors.end_time = "La hora fin es obligatoria";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleNext = () => { if (step === 1 && !validateStep1()) return; setStep(prev => prev + 1); };
    const handleBack = () => setStep(prev => Math.max(1, prev - 1));

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const payload = { ...form };
            payload.patient_id = parseInt(payload.patient_id);
            payload.employee_id = parseInt(payload.employee_id);
            payload.clinic_area_id = parseInt(payload.clinic_area_id);
            payload.unit_value = parseFloat(payload.unit_value || 0);
            payload.units = parseInt(payload.units || 1);
            payload.total_amount = parseFloat(payload.total_amount || 0);
            if (selectedServiceIds.length > 0) {
                payload.services = selectedServiceIds.map(id => {
                    const svc = services.find(s => s.id === id);
                    return { service_id: svc.id, service_name: svc.name, duration_minutes: svc.duration_minutes, price: parseFloat(svc.price || 0) };
                });
            } else { payload.services = []; }

            if (isEditing) {
                await updateAppointment(itemToEdit.id, payload);
                addToast({ type: "success", title: "Cita actualizada", message: "Cambios guardados." });
            } else {
                await createAppointment(payload);
                addToast({ type: "success", title: "Cita creada", message: "Cita registrada." });
            }
            onSaved(true);
        } catch (err) { console.error(err); addToast({ type: "error", title: "Error", message: err.message }); }
        finally { setSaving(false); }
    };

    const handleCancelClick = () => {
        if (hasChanges) setConfirmCancel(true);
        else handleExit();
    };

    const handleExit = () => { setForm(initialForm); setErrors({}); setStep(1); setIsCreatingProcess(false); setIsCreatingStep(false); setHasChanges(false); onClose(); };

    if (!open) return null;

    // Computed Helpers for Render
    const getPatientName = () => patients.find(x => x.id == form.patient_id)?.first_name + " " + patients.find(x => x.id == form.patient_id)?.last_name || form.patient_id;
    const getDoctorName = () => doctors.find(x => x.id == form.employee_id)?.first_name + " " + doctors.find(x => x.id == form.employee_id)?.last_name || form.employee_id;
    const getAreaName = () => clinicAreas.find(x => x.id == form.clinic_area_id)?.name || form.clinic_area_id;
    const getProcessName = () => availableProcesses.find(x => x.id === selectedProcessId)?.name || "Personalizado / Ninguno";

    // --- REUSABLE PROCESS EDITOR RENDERER ---
    const renderProcessEditor = (stepsList, targetId) => (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={stepsList} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {stepsList.map((pStep) => (
                                <SortableStepItem
                                    key={pStep.id}
                                    pStep={pStep}
                                    stepDef={availableSteps.find(s => s.id === pStep.step_id)}
                                    onChangeDuration={(val) => updateStepDuration(targetId, pStep.id, val)}
                                    onRemove={() => removeStepFromProcess(targetId, pStep.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {stepsList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <div className="w-10 h-10 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center mb-2">
                            <Plus size={20} />
                        </div>
                        <p className="text-xs mb-3">Este proceso no tiene pasos.</p>
                        <button onClick={() => setAddingStepsTargetId(targetId)} className="btn-secondary text-xs px-3 py-1.5 shadow-sm">Agregar Pasos</button>
                    </div>
                )}
            </div>

            {/* Add Steps Action (Footer of Editor) */}
            {stepsList.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2 flex justify-center">
                    <button onClick={() => setAddingStepsTargetId(targetId)} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 shadow-sm">
                        <Plus size={14} /> Agregar más pasos
                    </button>
                </div>
            )}
        </div>
    );

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-secondary rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-[700px] h-[700px] flex flex-col overflow-hidden transition-colors duration-200">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
                        <div>
                            <h2 className="text-xl font-semibold text-primary">{isEditing ? "Editar Cita" : "Nueva Cita"}</h2>
                            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Paso {step} de 4</p>
                        </div>
                        <button onClick={handleCancelClick} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"><X size={20} /></button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 relative">
                        {step === 1 && ( /* ... Step 1 Content ... */
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"> <label className="label-required block text-sm mb-1 dark:text-slate-200">Paciente</label>
                                    {patients.length > 0 ? <select ref={firstRef} name="patient_id" value={form.patient_id} onChange={handleChange} className={`input ${errors.patient_id ? "border-error" : ""}`}><option value="">Seleccionar paciente...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.medical_record_number})</option>)}</select> : <input name="patient_id" value={form.patient_id} onChange={handleChange} className="input" placeholder="ID Paciente" />}
                                    {errors.patient_id && <span className="text-error text-xs">{errors.patient_id}</span>}
                                </div>
                                <div><label className="label-required block text-sm mb-1 dark:text-slate-200">Área Clínica</label><select name="clinic_area_id" value={form.clinic_area_id} onChange={handleChange} className={`input ${errors.clinic_area_id ? "border-error" : ""}`}><option value="">Seleccionar área...</option>{clinicAreas.length > 0 ? clinicAreas.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option value="1">Unidad 1</option>}</select></div>
                                <div><label className="label-required block text-sm mb-1 dark:text-slate-200">Doctor</label><select name="employee_id" value={form.employee_id} onChange={handleChange} className={`input ${errors.employee_id ? "border-error" : ""}`}><option value="">Seleccionar doctor...</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}</select></div>
                                <div><label className="label-required block text-sm mb-1 dark:text-slate-200">Fecha</label><input type="date" name="date" value={form.date} onChange={handleChange} className="input" /></div>
                                <div className="flex gap-2">
                                    <div className="flex-1"><label className="label-required block text-sm mb-1 dark:text-slate-200">Inicio</label><input type="time" name="start_time" value={form.start_time} onChange={handleChange} className="input" /></div>
                                    <div className="flex-1"><label className="label-required block text-sm mb-1 dark:text-slate-200">Fin</label><input type="time" name="end_time" value={form.end_time} onChange={handleChange} className="input" /></div>
                                </div>
                                {isEditing && (
                                    <div className="col-span-2">
                                        <label className="block text-sm mb-1 dark:text-slate-200">Estado</label>
                                        <select name="status" value={form.status} onChange={handleChange} className="input">
                                            <option value="pendiente">Pendiente</option>
                                            <option value="confirmada">Confirmada</option>
                                            <option value="en_espera">En Sala de Espera</option>
                                            <option value="en_tratamiento">En Tratamiento</option>
                                            <option value="finalizada">Finalizada</option>
                                            <option value="cancelada">Cancelada</option>
                                        </select>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <label className="block text-sm mb-1 dark:text-slate-200">Notas</label>
                                    <textarea name="notes" value={form.notes || ""} onChange={handleChange} className="input min-h-[80px]" placeholder="Notas opcionales..." />
                                </div>
                            </div>
                        )}

                        {step === 2 && ( /* ... Step 2 Content ... */
                            <div className="flex flex-col h-full">
                                <div className="mb-3 flex gap-2">
                                    <input type="text" placeholder="Buscar servicio..." value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} className="input flex-1" />
                                    {selectedServiceIds.length > 0 && <button onClick={handleClearServices} className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 dark:text-slate-400 dark:hover:text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition shrink-0">Limpiar</button>}
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2 content-start min-h-[300px]">
                                    {services.filter(s => !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase())).map(svc => (
                                        <div key={svc.id} onClick={() => toggleService(svc.id)} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition border ${selectedServiceIds.includes(svc.id) ? "bg-sky-50 border-primary/50 dark:bg-slate-700/60" : "bg-white border-transparent hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/30"}`}>
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${selectedServiceIds.includes(svc.id) ? "bg-primary border-primary" : "border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-800"}`}>{selectedServiceIds.includes(svc.id) && <Check size={12} className="text-white" strokeWidth={3} />}</div>
                                            <div className="flex-1 text-xs">
                                                <span className="block font-medium mb-0.5 text-slate-700 dark:text-slate-200" style={{ color: svc.color }}>{svc.name}</span>
                                                <span className="block text-slate-500 dark:text-slate-400 font-medium">${svc.price} <span className="text-slate-400 dark:text-slate-600 mx-1">•</span> {svc.duration_minutes} min <span className="text-slate-400 dark:text-slate-600 mx-1">•</span> {svc.suggested_units} Un.</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <div><label className="block text-xs mb-1 font-medium text-slate-700 dark:text-slate-200">Total $</label><input className="input text-right font-semibold" type="number" name="total_amount" value={form.total_amount} onChange={handleChange} /></div>
                                    <div><label className="block text-xs mb-1 font-medium text-slate-700 dark:text-slate-200">Minutos</label><input className="input text-right font-semibold" type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} /></div>
                                    <div><label className="block text-xs mb-1 font-medium text-slate-700 dark:text-slate-200">Unidades</label><input className="input text-right font-semibold" type="number" name="units" value={form.units} onChange={handleChange} /></div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col h-full">
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">Proceso Operativo</h3>
                                    <p className="text-sm text-slate-500">Define o edita los pasos de ejecución.</p>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <div className="flex-1">
                                        <select className="input" value={selectedProcessId} onChange={(e) => { setHasChanges(true); setSelectedProcessId(e.target.value ? parseInt(e.target.value) : ""); }}>
                                            <option value="">Seleccionar proceso...</option>
                                            {availableProcesses.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => setIsCreatingProcess(true)} className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-600 transition flex items-center gap-2 text-sm font-medium">
                                        <Plus size={16} /> Nuevo Processo
                                    </button>
                                </div>

                                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex flex-col overflow-hidden">
                                    {selectedProcessId ? (
                                        <>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-medium text-slate-700 dark:text-slate-200">
                                                    Pasos: {availableProcesses.find(p => p.id === selectedProcessId)?.name}
                                                </h4>
                                                <div className="text-xs font-semibold px-2 py-1 bg-sky-100 text-primary rounded-full">
                                                    Total: {calculateProcessDuration(selectedProcessId)} min
                                                </div>
                                            </div>
                                            {renderProcessEditor(
                                                availableProcesses.find(p => p.id === selectedProcessId)?.steps || [],
                                                selectedProcessId
                                            )}
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                                <Edit2 size={20} />
                                            </div>
                                            <p className="text-sm">Selecciona un proceso para editarlo<br />o crea uno nuevo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                                <div className="mb-2">
                                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">Resumen de la Cita</h3>
                                    <p className="text-sm text-slate-500">Verifica los datos antes de guardar.</p>
                                </div>

                                {/* 1. Details */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <User size={14} /> Datos Básicos
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="block text-xs text-slate-400 mb-0.5">Paciente</span><span className="font-medium text-slate-800 dark:text-white">{getPatientName()}</span></div>
                                        <div><span className="block text-xs text-slate-400 mb-0.5">Doctor</span><span className="font-medium text-slate-800 dark:text-white">{getDoctorName()}</span></div>
                                        <div><span className="block text-xs text-slate-400 mb-0.5">Área Clínica</span><span className="font-medium text-slate-800 dark:text-white">{getAreaName()}</span></div>
                                        <div><span className="block text-xs text-slate-400 mb-0.5">Fecha y Hora</span><span className="font-medium text-slate-800 dark:text-white">{form.date} <span className="mx-1 text-slate-400">|</span> {form.start_time} - {form.end_time}</span></div>
                                        {form.notes && <div className="col-span-2 mt-1 p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs italic">"{form.notes}"</div>}
                                    </div>
                                </div>

                                {/* 2. Services */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Stethoscope size={14} /> Servicios Seleccionados ({selectedServiceIds.length})
                                    </h4>
                                    {selectedServiceIds.length > 0 ? (
                                        <div className="space-y-2 mb-3">
                                            {selectedServiceIds.map(id => {
                                                const svc = services.find(s => s.id === id);
                                                return svc ? (
                                                    <div key={id} className="flex justify-between items-start text-sm border-b border-slate-200 dark:border-slate-700 last:border-0 pb-1.5 last:pb-0">
                                                        <div>
                                                            <span className="font-medium text-slate-700 dark:text-slate-200 block" style={{ color: svc.color }}>{svc.name}</span>
                                                            <span className="text-xs text-slate-400">{svc.duration_minutes} min • {svc.suggested_units} Unidades</span>
                                                        </div>
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">${svc.price}</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    ) : <p className="text-sm text-slate-400 italic">Sin servicios seleccionados.</p>}
                                </div>

                                {/* 3. Process */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <FileText size={14} /> Proceso Operativo
                                    </h4>
                                    {selectedProcessId ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-primary text-sm">{getProcessName()}</span>
                                                <span className="text-xs font-semibold bg-sky-100 text-primary px-2 py-0.5 rounded-full">{calculateProcessDuration(selectedProcessId)} min</span>
                                            </div>
                                            <ul className="text-sm space-y-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                                {availableProcesses.find(p => p.id === selectedProcessId)?.steps.map(s => {
                                                    const stepDef = availableSteps.find(def => def.id === s.step_id);
                                                    const duration = s.duration_override !== null ? s.duration_override : stepDef?.duration_minutes;
                                                    return (
                                                        <li key={s.id} className="flex justify-between text-slate-600 dark:text-slate-400">
                                                            <span>{stepDef?.name}</span>
                                                            <span className="text-xs opacity-70">{duration}m</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ) : <p className="text-sm text-slate-400 italic">Ningún proceso asignado (Usando tiempo de servicios).</p>}
                                </div>

                                {/* Finals */}
                                <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-500 dark:text-slate-300 font-medium flex items-center gap-2"><Clock size={16} /> Tiempo Total Estimado</span>
                                        <span className="text-lg font-bold text-slate-800 dark:text-white">{form.duration_minutes} min</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-600">
                                        <span className="text-sm text-slate-500 dark:text-slate-300 font-medium flex items-center gap-2"><DollarSign size={16} /> Total a Cobrar</span>
                                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${form.total_amount}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center p-6 border-t border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-secondary">
                        {step > 1 ? (
                            <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:border-transparent dark:text-slate-200 dark:hover:bg-slate-600 transition text-sm font-medium">
                                <ArrowLeft size={16} /> Atrás
                            </button>
                        ) : (
                            <button onClick={handleCancelClick} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition text-sm font-medium">Cancelar</button>
                        )}
                        <div className="flex gap-2">
                            {step < 4 ? <button onClick={handleNext} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 transition text-sm font-medium shadow-lg shadow-sky-500/20">Siguiente <ArrowRight size={16} /></button> : <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition text-sm font-medium shadow-lg shadow-emerald-500/20">{saving ? "Guardando..." : "Confirmar y Guardar"}{!saving && <Check size={16} />}</button>}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* MODAL: NEW PROCESS */}
            <AnimatePresence>
                {isCreatingProcess && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 w-[600px] h-[600px] rounded-xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Crear Nuevo Proceso</h3>
                                <button onClick={() => setIsCreatingProcess(false)}><X size={20} className="text-slate-400 hover:text-slate-600 dark:hover:text-white" /></button>
                            </div>
                            <div className="flex-1 p-5 flex flex-col overflow-hidden">
                                <div className="mb-4">
                                    <label className="label-required block text-sm mb-1 text-slate-700 dark:text-slate-200">Nombre del Proceso</label>
                                    <input autoFocus type="text" className="input" placeholder="Ej: Tratamiento de Conducto" value={newProcessName} onChange={e => setNewProcessName(e.target.value)} />
                                </div>
                                <div className="flex-1 border rounded-lg p-3 dark:border-slate-700 overflow-hidden flex flex-col">
                                    <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Pasos del Proceso</h4>
                                    {renderProcessEditor(newProcessSteps, "new")}
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-2">
                                <button onClick={() => setIsCreatingProcess(false)} className="px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 text-sm font-medium">Cancelar</button>
                                <button onClick={handleSaveNewProcess} disabled={!newProcessName} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-sky-500 disabled:opacity-50 text-sm font-medium shadow-md shadow-sky-500/20">Guardar Proceso</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: ADD STEPS */}
            <AnimatePresence>
                {!!addingStepsTargetId && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-800 rounded-xl w-[500px] max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-600">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-800 dark:text-white">Agregar Pasos</h4>
                                    <p className="text-xs text-slate-500">Selecciona los pasos a añadir al proceso</p>
                                </div>
                                <button onClick={() => setAddingStepsTargetId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20} /></button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-hidden flex flex-col p-4">
                                {/* Create New Step Button - Always Visible at Top */}
                                <button onClick={() => setIsCreatingStep(true)} className="w-full flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-primary dark:text-sky-300 border border-dashed border-primary/30 dark:border-sky-500/30 rounded-lg p-3 mb-4 transition font-medium text-sm">
                                    <Plus size={16} /> Crear nuevo paso reusable
                                </button>

                                {/* Search */}
                                <div className="relative mb-3">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input autoFocus type="text" placeholder="Buscar pasos..." value={stepSearch} onChange={e => setStepSearch(e.target.value)} className="input pl-9" />
                                </div>

                                {/* List */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    {availableSteps.filter(s => !stepSearch || s.name.toLowerCase().includes(stepSearch.toLowerCase())).map(stepDef => {
                                        const isSelected = stepsToAdd.includes(stepDef.id);
                                        return (
                                            <div key={stepDef.id} onClick={() => toggleStepSelection(stepDef.id)} className={`flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition hover:bg-white dark:hover:bg-slate-800 last:border-0 ${isSelected ? "bg-sky-50 dark:bg-slate-800" : ""}`}>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-800"}`}>
                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <div className="flex-1">
                                                    <span className={`block text-sm font-medium ${isSelected ? "text-primary dark:text-sky-400" : "text-slate-700 dark:text-slate-200"}`}>{stepDef.name}</span>
                                                </div>
                                                <span className="text-xs text-slate-400">{stepDef.duration_minutes} min</span>
                                            </div>
                                        );
                                    })}
                                    {availableSteps.length === 0 && <p className="text-center py-6 text-sm text-slate-500">No hay pasos creados.</p>}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-b-xl">
                                <button onClick={() => setAddingStepsTargetId(null)} className="btn-secondary px-4 py-2">Cancelar</button>
                                <button onClick={confirmAddSteps} disabled={stepsToAdd.length === 0} className="btn-primary px-4 py-2 shadow-lg shadow-primary/20">
                                    Agregar {stepsToAdd.length > 0 && `(${stepsToAdd.length})`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: NEW STEP (CREATE) */}
            <AnimatePresence>
                {isCreatingStep && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-5 w-[400px] shadow-2xl border border-slate-200 dark:border-slate-600">
                            <h4 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Nuevo Paso Reusable</h4>
                            <div className="space-y-3">
                                <div><label className="label-required block text-sm mb-1 text-slate-600 dark:text-slate-300">Nombre</label><input autoFocus className="input" value={newStepName} onChange={e => setNewStepName(e.target.value)} /></div>
                                <div><label className="label-required block text-sm mb-1 text-slate-600 dark:text-slate-300">Duración Base (min)</label><input type="number" className="input" value={newStepDuration} onChange={e => setNewStepDuration(e.target.value)} /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setIsCreatingStep(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition">Cancelar</button>
                                <button onClick={handleSaveNewStep} className="px-4 py-1.5 rounded bg-primary text-white hover:bg-sky-500 text-sm font-medium shadow-md shadow-sky-500/20">Guardar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmDialog open={confirmCancel} title="Cancelar" message="¿Salir sin guardar el progreso?" onConfirm={handleExit} onCancel={() => setConfirmCancel(false)} />
        </>,
        document.body
    );
}
