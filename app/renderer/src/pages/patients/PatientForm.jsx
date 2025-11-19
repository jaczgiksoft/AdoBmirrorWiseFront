import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Upload } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { createPatient } from "@/services/patient.service";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";

export default function PatientForm({ open, onClose, onCreated, patientType }) {
    const { addToast } = useToastStore();

    // IDs temporales — luego puedes traerlos del backend
    const PATIENT_TYPE_IDS = {
        prospecto: 1,
        consulta_unica: 2,
    };

    // 📌 formulario base
    const initialForm = {
        // Paso 1
        medical_record_number: "",
        family_code: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        nickname: "",
        genre: "",
        birth_date: "",
        marital_status: "",
        phone_number: "",
        email: "",
        photo_file: null,
        photo_preview: null,
        photo_url: "",
        // Paso 2 (fiscal)
        rfc: "",
        company: "",
        company_address: "",
        // Paso 3
        legal_representatives: [],
        // Paso 4
        alerts: [],
        // Paso 5
        username: "",
        password: "",
        confirm_password: "",
        can_login: false,
        // Tipo (N:M)
        patient_type_ids: [],
    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1);

    const firstRef = useRef(null);

    // ⬇️ Asignar tipo según selección previa
    useEffect(() => {
        if (patientType) {
            const id = PATIENT_TYPE_IDS[patientType];
            if (id) {
                setForm((f) => ({
                    ...f,
                    patient_type_ids: [id],
                }));
            }
        }
    }, [patientType]);

    // Auto-focus
    useEffect(() => {
        if (open) firstRef.current?.focus();
    }, [open]);

    // 🎹 Atajos
    useHotkeys(
        {
            escape: () => {
                if (!open) return;
                if (Object.values(form).some((v) => v)) setConfirmCancel(true);
                else handleExit();
            },
            enter: () => {
                if (!open || confirmCancel) return;
                handleNextStep();
            },
        },
        [open, form, confirmCancel, step]
    );

    // 🔧 Manejo de cambios
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({
            ...f,
            [name]: type === "checkbox" ? checked : value,
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    // 📸 Manejo de foto
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const previewURL = URL.createObjectURL(file);

        setForm((f) => ({
            ...f,
            photo_file: file,
            photo_preview: previewURL,
        }));
    };

    // ✔ Validación
    const validateStep = () => {
        let newErrors = {};

        if (step === 1) {
            const required = [
                "medical_record_number",
                "first_name",
                "last_name",
                "genre",
                "birth_date",
                "phone_number",
            ];

            required.forEach((f) => {
                if (!form[f]?.trim()) newErrors[f] = "Campo obligatorio";
            });

            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                newErrors.email = "Correo inválido";
        }

        if (step === 5 && form.can_login) {
            if (!form.username) newErrors.username = "Usuario obligatorio";
            if (!form.password) newErrors.password = "Contraseña obligatoria";
            if (form.password !== form.confirm_password)
                newErrors.confirm_password = "Las contraseñas no coinciden";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (!validateStep()) return;
        if (step < 5) return setStep(step + 1);
        handleSubmit();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    // 💾 Guardar
    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);

        try {
            let payload = { ...form };
            delete payload.confirm_password;

            // 🔹 SI SUBES LA FOTO AL SERVIDOR
            if (form.photo_file) {
                // 🔥 TODO: REEMPLAZAR POR TU SERVICIO REAL DE UPLOAD
                const fakeURL = URL.createObjectURL(form.photo_file);
                payload.photo_url = fakeURL;
            }

            // No enviar preview ni file
            delete payload.photo_file;
            delete payload.photo_preview;

            await createPatient(payload);

            addToast({
                type: "success",
                title: "Paciente registrado",
                message: `${form.first_name} ${form.last_name} fue agregado correctamente.`,
            });

            handleExit();
            onCreated?.();
        } catch (err) {
            addToast({
                type: "error",
                title: "Error al registrar paciente",
                message: err.response?.data?.message || "No se pudo registrar.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleExit = () => {
        setForm(initialForm);
        setErrors({});
        setConfirmCancel(false);
        setStep(1);
        onClose();
    };

    if (!open) return null;

    // ------------------------------------------------------
    // STEPS VISUALES
    // ------------------------------------------------------
    function StepTabs({ step, setStep }) {
        const steps = [
            {
                id: 1,
                title: "Información general",
                desc: "Nombre, teléfono, dirección, foto, etc.",
            },
            {
                id: 2,
                title: "Información fiscal",
                desc: "RFC, empresa, ocupación",
            },
            {
                id: 3,
                title: "Representantes",
                desc: "Responsables legales",
            },
            {
                id: 4,
                title: "Alertas",
                desc: "Clínicas y administrativas",
            },
            {
                id: 5,
                title: "Acceso móvil",
                desc: "Usuario y contraseña",
            },
        ];

        return (
            <div className="flex gap-10 mb-6">
                {steps.map((s) => {
                    const active = step === s.id;

                    return (
                        <button
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={`
                    flex items-start gap-3 text-left group transition-all duration-200
                    ${active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"}
                `}
                        >
                            {/* CONTENEDOR DEL NÚMERO */}
                            <div className="relative mt-1">
                                {/* PULSO EXTERNO */}
                                {active && (
                                    <span
                                        className="
                                absolute inset-0 rounded-md bg-primary opacity-30
                                animate-pulse-ring
                            "
                                    />
                                )}

                                {/* NÚMERO (cuadro fijo) */}
                                <div
                                    className={`
                            relative w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold
                            transition-all duration-200
                            ${
                                        active
                                            ? "bg-primary text-white"
                                            : "bg-slate-700 text-slate-300 group-hover:bg-slate-600"
                                    }
                        `}
                                >
                                    {s.id}
                                </div>
                            </div>

                            {/* TEXTO */}
                            <div className="flex flex-col">
                    <span
                        className={`
                            text-sm font-semibold transition-all duration-200
                            ${active ? "text-primary" : "group-hover:text-slate-200"}
                        `}
                    >
                        {s.title}
                    </span>

                                <span
                                    className={`
                            text-xs transition-all duration-200
                            ${active ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"}
                        `}
                                >
                        {s.desc}
                    </span>

                                {/* Línea inferior */}
                                {active && (
                                    <div className="mt-1 w-full h-[2px] rounded-full bg-primary" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

        );
    }


    // ------------------------------------------------------
    // CONTENIDO POR PASO
    // ------------------------------------------------------
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-primary font-semibold text-sm mb-2">
                            🧩 PASO 1 — Información general
                        </h3>

                        {/* FOTO */}
                        <div className="flex items-center gap-4">
                            <label className="w-24 h-24 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition overflow-hidden">
                                {form.photo_preview ? (
                                    <img
                                        src={form.photo_preview}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-slate-400 flex flex-col items-center">
                                        <Upload size={20} />
                                        <span className="text-xs mt-1">Foto</span>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                            </label>

                            <div className="text-xs text-slate-400">
                                Selecciona la foto del paciente (opcional)
                            </div>
                        </div>

                        {/* Numero expediente + family code */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2 label-required">Número de expediente</label>
                                <input
                                    ref={firstRef}
                                    name="medical_record_number"
                                    value={form.medical_record_number}
                                    onChange={handleChange}
                                    className={`input ${errors.medical_record_number ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-2">Código familiar</label>
                                <input
                                    name="family_code"
                                    value={form.family_code}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* nombres */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2 label-required">Nombre</label>
                                <input
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    className={`input ${errors.first_name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2 label-required">Apellido paterno</label>
                                <input
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    className={`input ${errors.last_name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                        </div>

                        {/* más datos */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2">Apellido materno</label>
                                <input
                                    name="middle_name"
                                    value={form.middle_name}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">Apodo</label>
                                <input
                                    name="nickname"
                                    value={form.nickname}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* genero + nacimiento */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2 label-required">Género</label>
                                <select
                                    name="genre"
                                    value={form.genre}
                                    onChange={handleChange}
                                    className={`input ${
                                        errors.genre ? "border-error" : ""
                                    }`}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="male">Masculino</option>
                                    <option value="female">Femenino</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-2 label-required">Fecha de nacimiento</label>
                                <input
                                    type="date"
                                    name="birth_date"
                                    value={form.birth_date}
                                    onChange={handleChange}
                                    className={`input ${
                                        errors.birth_date ? "border-error" : ""
                                    }`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-2">Estado civil</label>
                            <select
                                name="marital_status"
                                value={form.marital_status}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="soltero">Soltero/a</option>
                                <option value="casado">Casado/a</option>
                                <option value="divorciado">Divorciado/a</option>
                                <option value="viudo">Viudo/a</option>
                                <option value="union libre">Unión libre</option>
                            </select>
                        </div>

                        {/* Teléfono y correo */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-2 label-required">Teléfono</label>
                                <input
                                    name="phone_number"
                                    value={form.phone_number}
                                    onChange={handleChange}
                                    className={`input ${
                                        errors.phone_number
                                            ? "border-error"
                                            : ""
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">Correo</label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={`input ${
                                        errors.email ? "border-error" : ""
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                );

            // 🔹 Paso 2 – Fiscal
            case 2:
                return (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-primary font-semibold text-sm mb-2">
                            🧾 PASO 2 — Información fiscal
                        </h3>

                        <input
                            name="rfc"
                            placeholder="RFC"
                            value={form.rfc}
                            onChange={handleChange}
                            className="input"
                        />
                        <input
                            name="company"
                            placeholder="Empresa"
                            value={form.company}
                            onChange={handleChange}
                            className="input"
                        />
                        <input
                            name="company_address"
                            placeholder="Dirección fiscal"
                            value={form.company_address}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                );

            // 🔹 Paso 3 — Representantes
            case 3:
                return (
                    <div>
                        <h3 className="text-primary font-semibold text-sm mb-2">
                            👥 PASO 3 — Representantes legales
                        </h3>
                        <p className="text-xs text-slate-400">
                            (Aquí luego conectaremos con tu modelo real)
                        </p>
                    </div>
                );

            // 🔹 Paso 4 — Alertas
            case 4:
                return (
                    <div>
                        <h3 className="text-primary font-semibold text-sm mb-2">
                            ⚠️ PASO 4 — Alertas del paciente
                        </h3>
                        <p className="text-xs text-slate-400">
                            (Más adelante se integrará con alertas reales)
                        </p>
                    </div>
                );

            // 🔹 Paso 5 — Acceso móvil
            case 5:
                return (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-primary font-semibold text-sm mb-2">
                            📱 PASO 5 — Acceso móvil
                        </h3>

                        <div className="flex gap-2 items-center">
                            <input
                                type="checkbox"
                                name="can_login"
                                checked={form.can_login}
                                onChange={handleChange}
                            />
                            <label>Activar acceso al portal</label>
                        </div>

                        {form.can_login && (
                            <>
                                <input
                                    name="username"
                                    placeholder="Usuario"
                                    value={form.username}
                                    onChange={handleChange}
                                    className={`input ${
                                        errors.username ? "border-error" : ""
                                    }`}
                                />

                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Contraseña"
                                    value={form.password}
                                    onChange={handleChange}
                                    className={`input ${
                                        errors.password ? "border-error" : ""
                                    }`}
                                />

                                <input
                                    type="password"
                                    name="confirm_password"
                                    placeholder="Confirmar contraseña"
                                    value={form.confirm_password}
                                    onChange={handleChange}
                                    className={`input ${
                                        errors.confirm_password
                                            ? "border-error"
                                            : ""
                                    }`}
                                />
                            </>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    // ------------------------------------------------------
    // MODAL FINAL
    // ------------------------------------------------------

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="
        bg-secondary rounded-2xl shadow-xl border border-slate-700
        w-[80%] max-w-[1100px]
        max-h-[90vh]
        overflow-y-auto
        p-6
    "
                >

                {/* HEADER */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-primary">
                            Registrar nuevo paciente
                        </h2>
                        <button
                            onClick={() =>
                                Object.values(form).some((v) => v)
                                    ? setConfirmCancel(true)
                                    : handleExit()
                            }
                            className="text-slate-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* TABS */}
                    <StepTabs step={step} setStep={setStep} />

                    {/* BODY */}
                    {renderStep()}

                    {/* FOOTER */}
                    <div className="flex justify-between mt-6">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
                            >
                                ← Atrás
                            </button>
                        ) : (
                            <div />
                        )}

                        <button
                            onClick={handleNextStep}
                            disabled={saving}
                            className="px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                        >
                            {step < 5
                                ? "Siguiente →"
                                : saving
                                    ? "Guardando..."
                                    : "Guardar"}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* MODAL CONFIRMAR SALIR */}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar registro"
                message="¿Deseas salir sin guardar?"
                onConfirm={handleExit}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </>,
        document.body
    );
}
