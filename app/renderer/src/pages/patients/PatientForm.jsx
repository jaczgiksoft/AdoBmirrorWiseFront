import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Upload, TriangleAlert, Plus, Loader2 } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { createPatient, getNextMedicalRecord } from "@/services/patient.service";
import { useHotkeys } from "@/hooks/useHotkeys";
import { ConfirmDialog } from "@/components/feedback";
import PatientAlertModal from "./shared/PatientAlertModal";
import PatientAlertList from "./shared/PatientAlertList";
import PatientRepresentativeModal from "./shared/PatientRepresentativeModal";
import PatientRepresentativeList from "./shared/PatientRepresentativeList";
import PatientBillingDataModal from "./shared/PatientBillingDataModal";
import PatientBillingDataList from "./shared/PatientBillingDataList";
import { getReferrals, createReferral } from "@/services/referral.service";
import BwiseDatePicker from "@/components/calendar/BwiseDatePicker";
import UniversalDatePicker from "@/components/inputs/UniversalDatePicker";
import dayjs from "dayjs";

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
        birth_date: dayjs().format("YYYY-MM-DD"),
        marital_status: "",
        phone_number: "",
        email: "",
        photo_file: null,
        photo_preview: null,
        photo_url: "",
        // Paso 2 (fiscal)
        billing_data: [],
        // Paso 3
        legal_representatives: [],
        // Paso 4
        alerts: [],
        // Tipo (N:M)
        patient_type_ids: [],
        address_street_name: "",
        address_neighborhood: "",
        address_apartment_number: "",
        address_street_number: "",
        address_zip_code: "",
        address_city: "",
        address_state: "",
        address_country: "",

    };

    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1);
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertEditingIndex, setAlertEditingIndex] = useState(null);
    const [representativeModalOpen, setRepresentativeModalOpen] = useState(false);
    const [representativeEditingIndex, setRepresentativeEditingIndex] = useState(null);
    const [billingModalOpen, setBillingModalOpen] = useState(false);
    const [billingEditingIndex, setBillingEditingIndex] = useState(null);
    const [referralModalOpen, setReferralModalOpen] = useState(false);
    const [newReferralName, setNewReferralName] = useState("");
    const [savingReferral, setSavingReferral] = useState(false);
    const [referrals, setReferrals] = useState([]);
    const today = new Date().toISOString().split("T")[0];
    const firstRef = useRef(null);

    const hasFormChanges = () =>
        JSON.stringify(form) !== JSON.stringify(initialForm);

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
                if (!open) return "prevent";
                if (alertModalOpen || confirmCancel) return "prevent";

                if (hasFormChanges()) {
                    setConfirmCancel(true);
                    return "prevent";
                }

                handleExit();
                return "prevent";
            },

            enter: () => {
                if (!open) return "prevent";
                if (alertModalOpen || confirmCancel) return "prevent";

                handleNextStep();
                return "prevent";
            },
        },

        // dependencias SIEMPRE presentes
        [form, step, alertModalOpen, confirmCancel, open],

        // enabled SIEMPRE presente
        open && !alertModalOpen && !confirmCancel
    );


    // ⚡ F5 desde Electron — GUARDA igual que ENTER
    useEffect(() => {
        if (!open) return;

        // Registramos listener seguro del preload
        window.electronAPI?.onSaveShortcut(() => {
            if (!open) return;
            if (alertModalOpen || confirmCancel) return;

            handleNextStep(); // valida → avanza / guarda
        });

    }, [open, alertModalOpen, confirmCancel, form, step]);

    function generateFamilyCode(length = 6) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    const fetchNextMedicalRecordNumber = async () => {
        try {
            const result = await getNextMedicalRecord(); // servicio

            const nextMRN = result.next;
            const famCode = generateFamilyCode();

            setForm(f => ({
                ...f,
                medical_record_number: nextMRN,
                family_code: famCode,
            }));

        } catch (err) {
            console.error("Error obteniendo expediente:", err);
        }
    };

    useEffect(() => {
        if (open) {
            fetchNextMedicalRecordNumber();
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        async function loadReferrals() {
            try {
                const data = await getReferrals();
                setReferrals(data);
            } catch (err) {
                console.error("Error cargando referidores:", err);
            }
        }

        loadReferrals();
    }, [open]);

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
                "email",
            ];

            required.forEach((f) => {
                const value = form[f];

                if (
                    value === null ||
                    value === undefined ||
                    (typeof value === "string" && value.trim() === "") ||
                    value === ""
                ) {
                    newErrors[f] = "Campo obligatorio";
                }
            });

            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                newErrors.email = "Correo inválido";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getAllowedSteps = (patientType) => {
        return patientType === "consulta_unica" ? [1, 2, 4, 5] : [1, 2, 3, 4, 5];
    };

    const handleNextStep = () => {
        const allowed = getAllowedSteps(patientType);

        if (!validateStep()) return;

        const currentIndex = allowed.indexOf(step);

        if (currentIndex < allowed.length - 1) {
            setStep(allowed[currentIndex + 1]);
            return;
        }

        // último → guardar
        handleSubmit();
    };

    const handleBack = () => {
        const allowed = getAllowedSteps(patientType);
        const currentIndex = allowed.indexOf(step);

        if (currentIndex > 0) {
            setStep(allowed[currentIndex - 1]);
        }
    };

    // 💾 Guardar
    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);

        try {
            let payload = { ...form };
            delete payload.confirm_password;

            if (form.photo_file) {
                payload.photo_file = form.photo_file; // archivo real para FormData
            }

            delete payload.photo_preview;

            console.log("📨 Datos enviados a la API:", payload);
            await createPatient(payload);

            addToast({
                type: "success",
                title: "Paciente registrado",
                message: `${form.first_name} ${form.last_name} fue agregado correctamente.`,
            });

            handleExit();
            onCreated?.();
        } catch (err) {
            // 1. Extraemos de forma segura la respuesta de Axios (o el objeto vacío si falla la red)
            const responseData = err || {};
            let errorTitle = "Error al registrar paciente";

            // 2. Tomamos el mensaje general ("Errores de validación" según tu JSON)
            let errorMsg = responseData.message || "No se pudo registrar.";

            // 3. Verificamos si existe un arreglo 'errors' y si tiene al menos un elemento
            if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
                // 4. Sobre-escribimos el mensaje general con el 'message' del primer error (índice 0)
                errorMsg = responseData.errors[0].message;
            }

            addToast({
                type: "error",
                title: errorTitle,
                message: errorMsg,
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

    const handleSaveQuickReferral = async () => {
        if (!newReferralName.trim()) {
            addToast({
                type: "error",
                title: "Campo requerido",
                message: "Por favor, ingresa el nombre del referido.",
            });
            return;
        }

        setSavingReferral(true);
        try {
            const newReferral = await createReferral({ name: newReferralName });

            // Refrescamos la lista completa desde la API para asegurar sincronía
            const updatedReferrals = await getReferrals();
            setReferrals(updatedReferrals);

            // Seleccionamos el nuevo ID automáticamente
            setForm((f) => ({
                ...f,
                referral_id: newReferral.referral.id,
            }));

            addToast({
                type: "success",
                title: "Referidor guardado",
                message: `"${newReferral.referral.name}" ha sido registrado correctamente.`,
            });

            setReferralModalOpen(false);
            setNewReferralName("");
        } catch (err) {
            addToast({
                type: "error",
                title: "Error al guardar",
                message: err.message || "No se pudo registrar el referido.",
            });
        } finally {
            setSavingReferral(false);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return "";

        const today = new Date();
        const dob = new Date(birthDate);

        let years = today.getFullYear() - dob.getFullYear();
        let months = today.getMonth() - dob.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        if (years < 0) return "";

        return `${years} años${months > 0 ? `, ${months} meses` : ""}`;
    };

    if (!open) return null;


    // ------------------------------------------------------
    // STEPS VISUALES
    // ------------------------------------------------------
    function StepTabs({ step, setStep }) {
        const ALL_STEPS = [
            { id: 1, title: "Información general", desc: "Nombre, teléfono, dirección, foto, etc." },
            { id: 2, title: "Información fiscal", desc: "RFC, empresa, ocupación" },
            { id: 3, title: "Representantes", desc: "Responsables legales" },
            { id: 4, title: "Alertas", desc: "Clínicas y administrativas" },
            { id: 5, title: "Confirmación", desc: "Revisión final de datos" },
        ];

        // 👇 Filtrado dinámico por tipo de paciente
        const steps = patientType === "consulta_unica"
            ? ALL_STEPS.filter((s) => [1, 2, 4, 5].includes(s.id))
            : ALL_STEPS;


        return (
            <div className="flex gap-10 mb-6">
                {steps.map((s) => {
                    const active = step === s.id;

                    // Número visible dependiendo del tipo
                    const visibleIndex = patientType === "consulta_unica"
                        ? [1, 2, 4, 5].indexOf(s.id) + 1
                        : s.id;

                    return (
                        <button
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={`
        flex items-start gap-3 text-left group transition-all duration-200
        ${active
                                    ? "text-primary"
                                    : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                }
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
                    ${active
                                            ? "bg-primary text-white"
                                            : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                        }

                        `}
                                >
                                    {visibleIndex}
                                </div>
                            </div>

                            {/* TEXTO */}
                            <div className="flex flex-col">
                                <span
                                    className={`
        text-sm font-semibold transition-all duration-200
        ${active ? "text-primary" : ""}
    `}
                                >
                                    {s.title}
                                </span>


                                <span
                                    className={`
                                        text-xs transition-all duration-200
                                        ${active
                                            ? "text-slate-700 dark:text-slate-300"
                                            : "text-slate-500 dark:text-slate-500"
                                        }
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
        const allowed = getAllowedSteps(patientType);
        if (!allowed.includes(step)) return null;
        switch (step) {
            case 1:
                return (
                    <div className="flex flex-col gap-5">

                        <h3 className="text-primary font-semibold text-sm">
                            🧩 PASO 1 — Información general
                        </h3>

                        {/* FOTO */}
                        <div className="flex items-center gap-4">
                            <label className="    w-24 h-24 rounded-xl
    bg-slate-200 dark:bg-slate-800
    border border-slate-300 dark:border-slate-700
    flex items-center justify-center cursor-pointer
    hover:bg-slate-300 dark:hover:bg-slate-700
    transition overflow-hidden">
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
                                <label className="block text-sm mb-1 label-required">Número de expediente</label>
                                <input
                                    ref={firstRef}
                                    name="medical_record_number"
                                    placeholder="Ej: 000123"
                                    value={form.medical_record_number}
                                    onChange={handleChange}
                                    className={`input ${errors.medical_record_number ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Código familiar</label>
                                <input
                                    name="family_code"
                                    placeholder="Ej: FAM-01"
                                    value={form.family_code}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* nombres */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 label-required">Nombre</label>
                                <input
                                    name="first_name"
                                    placeholder="Ej: Juan"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    className={`input ${errors.first_name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 label-required">Apellido paterno</label>
                                <input
                                    name="last_name"
                                    placeholder="Ej: Hernández"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    className={`input ${errors.last_name ? "border-error ring-1 ring-error/50" : ""}`}
                                />
                            </div>
                        </div>

                        {/* más datos */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1">Apellido materno</label>
                                <input
                                    name="middle_name"
                                    placeholder="Ej: Gómez"
                                    value={form.middle_name}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Apodo</label>
                                <input
                                    name="nickname"
                                    placeholder="Ej: Juanito"
                                    value={form.nickname}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* genero + nacimiento */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 label-required">Género</label>
                                <select
                                    name="genre"
                                    value={form.genre}
                                    onChange={handleChange}
                                    className={`input ${errors.genre ? "border-error" : ""}`}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="male">Masculino</option>
                                    <option value="female">Femenino</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>

                            <div className="flex flex-col relative z-[50]">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm label-required">Fecha de nacimiento</label>
                                    {form.birth_date && (
                                        <span className="text-xs text-primary font-medium">
                                            {calculateAge(form.birth_date)}
                                        </span>
                                    )}
                                </div>

                                {/* <BwiseDatePicker
                                    value={form.birth_date}
                                    onChange={(val) => {
                                        setForm((f) => ({ ...f, birth_date: val }));
                                        setErrors((prev) => ({ ...prev, birth_date: "" }));
                                    }}
                                    error={errors.birth_date}
                                    maxDate={new Date()}
                                /> */}
                                <UniversalDatePicker
                                    value={form.birth_date}
                                    onChange={(val) => {
                                        setForm((f) => ({ ...f, birth_date: val }));
                                        setErrors((prev) => ({ ...prev, birth_date: "" }));
                                    }}
                                    error={errors.birth_date}
                                    maxDate={new Date()}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Estado civil */}
                            <div>
                                <label className="block text-sm mb-1">Estado civil</label>
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

                            {/* Referidor */}
                            <div>
                                <label className="block text-sm mb-1">Referido por</label>
                                <div className="flex gap-2">
                                    <select
                                        name="referral_id"
                                        value={form.referral_id || ""}
                                        onChange={handleChange}
                                        className="input flex-1"
                                    >
                                        <option value="">Sin referidor</option>
                                        {referrals.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setReferralModalOpen(true)}
                                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                        title="Nuevo referidor"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Teléfono y correo */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 label-required">Teléfono</label>
                                <input
                                    name="phone_number"
                                    placeholder="Ej: 55-1234-5678"
                                    value={form.phone_number}
                                    onChange={handleChange}
                                    className={`input ${errors.phone_number ? "border-error" : ""}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 label-required">Correo</label>
                                <input
                                    name="email"
                                    placeholder="correo@ejemplo.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={`input ${errors.email ? "border-error" : ""}`}
                                />
                            </div>
                        </div>

                        {/* Dirección */}
                        <div className="mt-4">
                            <h4 className="text-primary font-semibold text-sm mb-2">🏠 Dirección</h4>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm mb-1">Calle</label>
                                    <input
                                        name="address_street_name"
                                        placeholder="Ej: Av. Reforma"
                                        value={form.address_street_name}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Número exterior</label>
                                    <input
                                        name="address_street_number"
                                        placeholder="Ej: 123"
                                        value={form.address_street_number}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label className="block text-sm mb-1">Número interior / Departamento</label>
                                    <input
                                        name="address_apartment_number"
                                        placeholder="Ej: 4B"
                                        value={form.address_apartment_number}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Colonia</label>
                                    <input
                                        name="address_neighborhood"
                                        placeholder="Ej: Centro"
                                        value={form.address_neighborhood}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label className="block text-sm mb-1">Código postal</label>
                                    <input
                                        name="address_zip_code"
                                        placeholder="Ej: 06000"
                                        value={form.address_zip_code}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Ciudad</label>
                                    <input
                                        name="address_city"
                                        placeholder="Ej: Ciudad de México"
                                        value={form.address_city}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label className="block text-sm mb-1">Estado</label>
                                    <input
                                        name="address_state"
                                        placeholder="Ej: CDMX"
                                        value={form.address_state}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">País</label>
                                    <input
                                        name="address_country"
                                        placeholder="Ej: México"
                                        value={form.address_country}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>


                    </div>
                );

            // 🔹 Paso 2 – Fiscal
            // 🔹 Paso 2 — Datos de facturación
            case 2:
                return (
                    <div className="flex flex-col gap-6 pb-4">

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-primary">
                                    Datos de facturación
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Registra uno o varios datos fiscales para este paciente.
                                </p>
                            </div>

                            <button
                                onClick={handleAddBilling}
                                className="
                        flex items-center gap-2 px-4 py-2
                        rounded-lg bg-cyan-500 text-white
                        hover:bg-cyan-600
                        dark:bg-primary dark:hover:bg-primary/80
                    "
                            >
                                <span className="text-base leading-none">+</span>
                                <span className="text-sm font-medium">Nuevo dato fiscal</span>
                            </button>
                        </div>

                        <div className="
                rounded-xl border border-slate-300 dark:border-slate-700
                bg-slate-100 dark:bg-slate-800/40 p-4 shadow-inner
            ">
                            {form.billing_data?.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                                    No hay datos fiscales registrados.
                                </p>
                            ) : (
                                <PatientBillingDataList
                                    list={form.billing_data}
                                    onEdit={handleEditBilling}
                                    onDelete={handleDeleteBilling}
                                />
                            )}
                        </div>

                        {/* MODAL */}
                        <PatientBillingDataModal
                            open={billingModalOpen}
                            onClose={() => setBillingModalOpen(false)}
                            onSave={handleSaveBilling}
                            billingData={
                                billingEditingIndex !== null
                                    ? form.billing_data[billingEditingIndex]
                                    : null
                            }
                        />
                    </div>
                );

            // 🔹 Paso 3 — Representantes
            // 🔹 Paso 3 — Representantes
            case 3:
                return (
                    <div className="flex flex-col gap-6 pb-4">

                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                    Representantes legales
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Agrega los responsables directos del paciente.
                                </p>
                            </div>

                            <button
                                onClick={handleAddRepresentative}
                                className="
                        flex items-center gap-2 px-4 py-2
                        rounded-lg bg-cyan-500 text-white
                        hover:bg-cyan-600
                        dark:bg-primary dark:hover:bg-primary/80
                    "
                            >
                                <span className="text-base leading-none">+</span>
                                <span className="text-sm font-medium">Nuevo representante</span>
                            </button>
                        </div>

                        <div className="
                rounded-xl border border-slate-300 dark:border-slate-700
                bg-slate-100 dark:bg-slate-800/40 p-4 shadow-inner
            ">
                            {form.legal_representatives.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                                    No hay representantes agregados.
                                </p>
                            ) : (
                                <PatientRepresentativeList
                                    reps={form.legal_representatives}
                                    onEdit={handleEditRepresentative}
                                    onDelete={handleDeleteRepresentative}
                                />
                            )}
                        </div>

                        <PatientRepresentativeModal
                            open={representativeModalOpen}
                            onClose={() => setRepresentativeModalOpen(false)}
                            onSave={handleSaveRepresentative}
                            representative={
                                representativeEditingIndex !== null
                                    ? form.legal_representatives[representativeEditingIndex]
                                    : null
                            }
                            patientData={form}
                        />

                    </div>
                );

            // 🔹 Paso 4 — Alertas
            case 4:
                return (
                    <div className="flex flex-col gap-6 pb-4">

                        {/* HEADER / TITLE */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                    Alertas del paciente
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Registra advertencias importantes para su atención clínica o administrativa.
                                </p>
                            </div>

                            <button
                                onClick={handleAddAlert}
                                className="
                            flex items-center gap-2 px-4 py-2
    rounded-lg bg-cyan-500 text-white
    hover:bg-cyan-600
    dark:bg-primary dark:hover:bg-primary/80
    cursor-pointer"
                            >
                                <span className="text-base leading-none">+</span>
                                <span className="text-sm font-medium">Nueva alerta</span>
                            </button>
                        </div>

                        {/* PANEL DEL CONTENIDO */}
                        <div
                            className="
                   rounded-xl
    border border-slate-300 dark:border-slate-700
    bg-slate-100 dark:bg-slate-800/40
    p-4 shadow-inner
                "
                        >
                            {form.alerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="text-4xl mb-2 opacity-70">
                                        <TriangleAlert size={45} className="text-yellow-500" />
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-[300px]">
                                        Aquí aparecerán las alertas que registres para este paciente.
                                        Puedes agregar alertas clínicas o administrativas.
                                    </p>

                                    <button
                                        onClick={handleAddAlert}
                                        className="
                                mt-4 px-4 py-2 rounded-lg bg-primary text-white
                                hover:bg-primary/90 transition
                            "
                                    >
                                        Crear mi primera alerta
                                    </button>
                                </div>
                            ) : (
                                <PatientAlertList
                                    alerts={form.alerts}
                                    onEdit={handleEditAlert}
                                    onDelete={handleDeleteAlert}
                                />
                            )}
                        </div>

                        {/* MODAL */}
                        <PatientAlertModal
                            open={alertModalOpen}
                            onClose={() => setAlertModalOpen(false)}
                            onSave={handleSaveAlert}
                            alert={alertEditingIndex !== null ? form.alerts[alertEditingIndex] : null}
                        />
                    </div>
                );

            // 🔹 Paso 5 — Confirmación final
            case 5:
                return (
                    <div className="flex flex-col gap-5">

                        <h3 className="text-primary font-semibold text-sm">
                            📱 PASO 5 — Confirmación final
                        </h3>

                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Antes de guardar, revisa que la información del paciente esté correcta.
                            El acceso al portal se activará automáticamente utilizando su número telefónico.
                        </p>

                        {/* Resumen simple */}
                        <div className="
                p-4 rounded-xl border border-slate-300 dark:border-slate-700
                bg-slate-100 dark:bg-slate-800/40 shadow-inner
            ">
                            <h4 className="font-semibold text-sm text-primary mb-2">Resumen del paciente</h4>

                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <li><strong>Nombre:</strong> {form.first_name} {form.last_name}</li>
                                <li><strong>Teléfono:</strong> {form.phone_number}</li>
                                <li><strong>Correo:</strong> {form.email || "—"}</li>
                            </ul>
                            <div className="flex flex-col gap-4 mt-3">

                                {/* REPRESENTANTES */}
                                <div>
                                    <h5 className="text-xs font-semibold text-primary mb-1">Representantes</h5>
                                    {form.legal_representatives.length === 0 ? (
                                        <p className="text-xs text-slate-500">— Ninguno —</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {form.legal_representatives.map((rep, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                                                >
                                                    <span>👤</span> {rep.full_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ALERTAS */}
                                <div>
                                    <h5 className="text-xs font-semibold text-primary mb-1">Alertas</h5>
                                    {form.alerts.length === 0 ? (
                                        <p className="text-xs text-slate-500">— Ninguna —</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {form.alerts.map((a, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${a.is_admin_alert
                                                        ? "bg-yellow-200 text-yellow-800"
                                                        : "bg-red-200 text-red-800"
                                                        }`}
                                                >
                                                    {a.is_admin_alert ? "⚠️" : "🩺"} {a.title}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* DATOS FISCALES */}
                                <div>
                                    <h5 className="text-xs font-semibold text-primary mb-1">Datos fiscales</h5>
                                    {form.billing_data.length === 0 ? (
                                        <p className="text-xs text-slate-500">— Ninguno —</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {form.billing_data.map((b, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`px-2 py-1 text-xs rounded-full bg-cyan-200 text-cyan-800 flex items-center gap-1`}
                                                >
                                                    🧾 {b.business_name}
                                                    {b.is_primary && (
                                                        <span className="text-[10px] bg-primary text-white px-1 rounded">
                                                            Principal
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>

                        </div>


                        <p className="text-xs text-slate-500 dark:text-slate-500">
                            Si necesitas corregir algo, navega entre los pasos con los botones “Atrás” o los tabs superiores.
                        </p>

                    </div>
                );

            default:
                return null;
        }
    };

    // ------------------------------------------------------
    // CONTENIDO DE ALERTAS
    // ------------------------------------------------------
    const handleAddAlert = () => {
        setAlertEditingIndex(null);
        setAlertModalOpen(true);
    };

    const handleEditAlert = (index) => {
        setAlertEditingIndex(index);
        setAlertModalOpen(true);
    };

    const handleDeleteAlert = (index) => {
        setForm((f) => ({
            ...f,
            alerts: f.alerts.filter((_, i) => i !== index),
        }));
    };

    const handleSaveAlert = (alertData) => {
        setForm((f) => {
            const updated = [...f.alerts];
            if (alertEditingIndex !== null) {
                updated[alertEditingIndex] = alertData;
            } else {
                updated.push(alertData);
            }
            return { ...f, alerts: updated };
        });

        setAlertModalOpen(false);
        setAlertEditingIndex(null);
    };

    const readableType = {
        prospecto: "Prospecto",
        consulta_unica: "Consulta única",
    }[patientType] || "";

    const handleAddRepresentative = () => {
        setRepresentativeEditingIndex(null);
        setRepresentativeModalOpen(true);
    };

    const handleEditRepresentative = (index) => {
        setRepresentativeEditingIndex(index);
        setRepresentativeModalOpen(true);
    };

    const handleDeleteRepresentative = (index) => {
        setForm((f) => ({
            ...f,
            legal_representatives: f.legal_representatives.filter((_, i) => i !== index),
        }));
    };

    const handleSaveRepresentative = (rep) => {
        setForm((f) => {
            const updated = [...f.legal_representatives];
            if (representativeEditingIndex !== null) {
                updated[representativeEditingIndex] = rep;
            } else {
                updated.push(rep);
            }
            return { ...f, legal_representatives: updated };
        });

        setRepresentativeEditingIndex(null);
        setRepresentativeModalOpen(false);
    };

    const handleAddBilling = () => {
        setBillingEditingIndex(null);
        setBillingModalOpen(true);
    };

    const handleEditBilling = (index) => {
        setBillingEditingIndex(index);
        setBillingModalOpen(true);
    };

    const handleDeleteBilling = (index) => {
        setForm((f) => ({
            ...f,
            billing_data: f.billing_data.filter((_, i) => i !== index),
        }));
    };

    const handleSaveBilling = (billing) => {
        setForm((f) => {
            let updated = [...f.billing_data];

            // si marca principal, desmarcar todos los demás
            if (billing.is_primary) {
                updated = updated.map((b) => ({ ...b, is_primary: false }));
            }

            if (billingEditingIndex !== null) {
                updated[billingEditingIndex] = billing;
            } else {
                updated.push(billing);
            }

            return { ...f, billing_data: updated };
        });

        setBillingEditingIndex(null);
        setBillingModalOpen(false);
    };


    // ------------------------------------------------------
    // MODAL FINAL
    // ------------------------------------------------------

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <motion.div
                    id="patientFormModal"
                    tabIndex={-1}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="
    bg-white dark:bg-secondary
    text-slate-800 dark:text-slate-50
    outline-none rounded-2xl shadow-xl
    border border-slate-300 dark:border-slate-700
    w-[80%] max-w-[1100px]
    max-h-[90vh]
    flex flex-col overflow-hidden
    "
                >
                    {/* HEADER — AHORA ES FIJO */}
                    <div className="    sticky top-0 z-10
    bg-white dark:bg-secondary
    border-b border-slate-300 dark:border-slate-700
    px-6 py-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                                Registrar nuevo paciente
                                {patientType && (
                                    <span className="text-slate-400 text-sm">
                                        — {patientType === "prospecto" ? "Prospecto" : "Consulta única"}
                                    </span>
                                )}
                            </h2>

                            <button
                                onClick={() =>
                                    Object.values(form).some((v) => v)
                                        ? setConfirmCancel(true)
                                        : handleExit()
                                }
                                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* BODY SCROLLEABLE */}
                    {/* TABS STICKY */}
                    <div className="
    sticky top-[64px] z-10
    bg-white dark:bg-secondary
    border-b border-slate-300 dark:border-slate-700
    px-6 py-3
">
                        <StepTabs step={step} setStep={setStep} />
                    </div>

                    {/* BODY SCROLLEABLE */}
                    <div className="
    px-6 py-4 overflow-y-auto flex-1
    max-h-[calc(90vh-140px)]
    bg-slate-50 dark:bg-secondary
    text-slate-800 dark:text-slate-50
">
                        {renderStep()}
                    </div>



                    {/* FOOTER — TAMBIÉN FIJO */}
                    <div style={{ zIndex: 100 }} className="    sticky bottom-0 z-10
    bg-white dark:bg-secondary
    border-t border-slate-300 dark:border-slate-700
    px-6 py-4 flex justify-between">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="   px-3 py-2 rounded-lg
    bg-slate-200 text-slate-700 hover:bg-slate-300
    dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                            >
                                ← Atrás
                            </button>
                        ) : (
                            <div />
                        )}

                        <button
                            onClick={handleNextStep}
                            disabled={saving}
                            className="    px-3 py-2 rounded-lg
    bg-cyan-500 text-white
    hover:bg-cyan-600
    dark:bg-primary dark:hover:bg-primary/80
    disabled:opacity-50"
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
            {/* MODAL NUEVO REFERIDOR */}
            {referralModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-secondary rounded-xl border border-slate-300 dark:border-slate-700 p-6 w-[400px] shadow-xl"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                                <Plus size={20} />
                                Nuevo Referidor
                            </h2>
                            <button
                                type="button"
                                onClick={() => setReferralModalOpen(false)}
                                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 label-required">Nombre</label>
                                <input
                                    autoFocus
                                    className="input"
                                    placeholder="Ej: Recomendación de paciente"
                                    value={newReferralName}
                                    onChange={(e) => setNewReferralName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveQuickReferral();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setReferralModalOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveQuickReferral}
                                    disabled={savingReferral}
                                    className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
                                >
                                    {savingReferral ? <Loader2 className="animate-spin" size={18} /> : "Guardar"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>,
        document.body
    );
}
