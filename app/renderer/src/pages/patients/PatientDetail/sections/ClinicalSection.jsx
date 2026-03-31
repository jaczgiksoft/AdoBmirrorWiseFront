import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Pill,
    HeartPulse,
    Calendar,
    Baby,
    CheckCircle2,
    XCircle,
    ScanHeart,
    Save,
    RotateCcw,
} from "lucide-react";
import { updatePatient } from "@/services/patient.service";
import { useToastStore } from "@/store/useToastStore";

export default function ClinicalSection() {
    const { profile, refreshProfile } = useOutletContext();
    const { addToast } = useToastStore();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleEdit = () => {
        setFormData({ ...profile });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(null);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updatePatient(profile.id, formData);
            await refreshProfile();
            addToast({
                title: "Cambios guardados",
                description: "La historia clínica se ha actualizado correctamente.",
                type: "success"
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error al guardar:", error);
            addToast({
                title: "Error al guardar",
                description: "No se pudieron guardar los cambios en la historia clínica.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    /** Utilidad para booleanos en vista */
    const Bool = ({ value }) => (
        <span
            className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${value ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}
            `}
        >
            {value ? "Sí" : "No"}
        </span>
    );

    const data = isEditing ? formData : profile;

    return (
        <div className="space-y-10 text-slate-800 dark:text-slate-200">

            {/* HEADER PREMIUM CON EDITAR / GUARDAR */}
            <div className="flex items-start justify-between w-full">
                <div className="flex items-start gap-3">
                    <div className="h-12 w-1.5 bg-primary rounded-full mt-1.5"></div>

                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <ScanHeart size={28} className="text-primary" />
                            <h1 className="text-3xl font-bold text-primary">
                                Historia clínica del paciente
                            </h1>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Información médica, antecedentes y hábitos registrados en el expediente.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isEditing ? (
                        <button
                            onClick={handleEdit}
                            className="
                                flex items-center gap-2
                                px-4 py-2
                                bg-yellow-500 text-white
                                rounded-xl shadow-sm
                                text-sm font-medium
                                hover:bg-yellow-600
                                active:scale-[0.97]
                                transition-all duration-150
                            "
                        >
                            ✏️ Editar
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="
                                    flex items-center gap-2
                                    px-4 py-2
                                    bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200
                                    rounded-xl shadow-sm
                                    text-sm font-medium
                                    hover:bg-slate-300 dark:hover:bg-slate-600
                                    disabled:opacity-50
                                    transition-all duration-150
                                "
                            >
                                <RotateCcw size={16} />
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="
                                    flex items-center gap-2
                                    px-4 py-2
                                    bg-primary text-white
                                    rounded-xl shadow-sm
                                    text-sm font-medium
                                    hover:opacity-90
                                    active:scale-[0.97]
                                    disabled:opacity-50
                                    transition-all duration-150
                                "
                            >
                                <Save size={16} />
                                {loading ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* =========================================================
                1. TRATAMIENTOS Y MEDICACIÓN
            ========================================================= */}
            <Section icon={Pill} title="Tratamientos y Medicación">
                <div className="grid grid-cols-2 gap-4">
                    {isEditing ? (
                        <>
                            <BoolInput
                                label="¿Bajo tratamiento médico?"
                                value={data.is_under_medical_treatment}
                                onChange={(v) => handleChange("is_under_medical_treatment", v)}
                            />
                            <BoolInput
                                label="¿Toma medicamentos?"
                                value={data.is_taking_medication}
                                onChange={(v) => handleChange("is_taking_medication", v)}
                            />
                            <BoolInput
                                label="¿Alergia a medicamentos?"
                                value={data.is_allergic_to_medication}
                                onChange={(v) => handleChange("is_allergic_to_medication", v)}
                            />
                            {data.is_allergic_to_medication && (
                                <TextInput
                                    label="Descripción de alergias"
                                    value={data.allergies_description}
                                    onChange={(v) => handleChange("allergies_description", v)}
                                    placeholder="Especifique las alergias..."
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <InfoItem label="¿Bajo tratamiento médico?">
                                <Bool value={data.is_under_medical_treatment} />
                            </InfoItem>
                            <InfoItem label="¿Toma medicamentos?">
                                <Bool value={data.is_taking_medication} />
                            </InfoItem>
                            <InfoItem label="¿Alergia a medicamentos?">
                                <Bool value={data.is_allergic_to_medication} />
                            </InfoItem>
                            <InfoItem label="Descripción de alergias">
                                {data.allergies_description || "—"}
                            </InfoItem>
                        </>
                    )}
                </div>

                {/* Texto opcional en vista o Inputs en edición */}
                {isEditing ? (
                    <div className="mt-4 grid grid-cols-2 gap-6">
                        <TextInput
                            label="Tratamiento actual"
                            value={data.current_treatment_description}
                            onChange={(v) => handleChange("current_treatment_description", v)}
                            placeholder="Descripción del tratamiento..."
                        />
                        {data.is_taking_medication && (
                            <TextInput
                                label="Medicamentos actuales"
                                value={data.current_medications}
                                onChange={(v) => handleChange("current_medications", v)}
                                placeholder="Lista de medicamentos..."
                            />
                        )}
                    </div>
                ) : (
                    (data.current_treatment_description || data.current_medications) && (
                        <div className="mt-4 grid grid-cols-2 gap-6">
                            {data.current_treatment_description && (
                                <InfoItem label="Tratamiento actual">
                                    {data.current_treatment_description}
                                </InfoItem>
                            )}
                            {data.current_medications && (
                                <InfoItem label="Medicamentos actuales">
                                    {data.current_medications}
                                </InfoItem>
                            )}
                        </div>
                    )
                )}
            </Section>

            {/* =========================================================
                2. CONDICIONES MÉDICAS (CHECKLIST TIPO SUMMARY)
            ========================================================= */}
            <Section icon={HeartPulse} title="Condiciones Médicas">
                <div className={isEditing ? "flex flex-wrap gap-2" : "grid grid-cols-3 gap-x-6 gap-y-3"}>
                    {isEditing ? (
                        <>
                            <ChipInput label="Hepatitis" value={data.has_hepatitis} onClick={() => handleChange("has_hepatitis", !data.has_hepatitis)} />
                            <ChipInput label="Diabetes" value={data.has_diabetes} onClick={() => handleChange("has_diabetes", !data.has_diabetes)} />
                            <ChipInput label="Pulmonares" value={data.has_lung_conditions} onClick={() => handleChange("has_lung_conditions", !data.has_lung_conditions)} />
                            <ChipInput label="Migrañas" value={data.has_migraines} onClick={() => handleChange("has_migraines", !data.has_migraines)} />
                            <ChipInput label="Amigdalitis" value={data.has_amigdalitis} onClick={() => handleChange("has_amigdalitis", !data.has_amigdalitis)} />
                            <ChipInput label="Adenoiditis" value={data.has_adenoiditis} onClick={() => handleChange("has_adenoiditis", !data.has_adenoiditis)} />
                            <ChipInput label="Epilepsia" value={data.has_epilepsy} onClick={() => handleChange("has_epilepsy", !data.has_epilepsy)} />
                            <ChipInput label="Fiebre reumática" value={data.has_rheumatic_fever} onClick={() => handleChange("has_rheumatic_fever", !data.has_rheumatic_fever)} />
                            <ChipInput label="Psicológicas" value={data.has_psychological_conditions} onClick={() => handleChange("has_psychological_conditions", !data.has_psychological_conditions)} />
                            <ChipInput label="Cardiacas" value={data.has_heart_conditions} onClick={() => handleChange("has_heart_conditions", !data.has_heart_conditions)} />
                            <ChipInput label="Hemofilia" value={data.has_hemophilia} onClick={() => handleChange("has_hemophilia", !data.has_hemophilia)} />
                            <ChipInput label="ETS" value={data.has_stds} onClick={() => handleChange("has_stds", !data.has_stds)} />
                        </>
                    ) : (
                        <>
                            <Check label="Hepatitis" value={data.has_hepatitis} />
                            <Check label="Diabetes" value={data.has_diabetes} />
                            <Check label="Pulmonares" value={data.has_lung_conditions} />
                            <Check label="Migrañas" value={data.has_migraines} />
                            <Check label="Amigdalitis" value={data.has_amigdalitis} />
                            <Check label="Adenoiditis" value={data.has_adenoiditis} />
                            <Check label="Epilepsia" value={data.has_epilepsy} />
                            <Check label="Fiebre reumática" value={data.has_rheumatic_fever} />
                            <Check label="Psicológicas" value={data.has_psychological_conditions} />
                            <Check label="Cardiacas" value={data.has_heart_conditions} />
                            <Check label="Hemofilia" value={data.has_hemophilia} />
                            <Check label="Enfermedades venéreas (ETS)" value={data.has_stds} />
                        </>
                    )}
                </div>
            </Section>

            {/* =========================================================
                3. EMBARAZO — SOLO PARA FEMENINO
            ========================================================= */}
            {data.genre === "female" && (
                <Section icon={Baby} title="Embarazo">
                    <div className="grid grid-cols-2 gap-6">
                        {isEditing ? (
                            <>
                                <BoolInput
                                    label="¿Está embarazada?"
                                    value={data.is_pregnant}
                                    onChange={(v) => handleChange("is_pregnant", v)}
                                />
                                {data.is_pregnant && (
                                    <TextInput
                                        label="Semanas de embarazo"
                                        value={data.pregnancy_weeks}
                                        onChange={(v) => handleChange("pregnancy_weeks", v)}
                                        type="number"
                                        placeholder="Ej. 12"
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <InfoItem label="¿Está embarazada?">
                                    <Bool value={data.is_pregnant} />
                                </InfoItem>
                                <InfoItem label="Semanas de embarazo">
                                    {data.pregnancy_weeks || "—"}
                                </InfoItem>
                            </>
                        )}
                    </div>
                </Section>
            )}

            {/* =========================================================
                4. FECHAS CLÍNICAS
            ========================================================= */}
            <Section icon={Calendar} title="Fechas Clínicas">
                <div className="grid grid-cols-2 gap-6">
                    {isEditing ? (
                        <>
                            <DateInput
                                label="Última radiografía"
                                value={data.last_radiograph_date}
                                onChange={(v) => handleChange("last_radiograph_date", v)}
                            />
                            <DateInput
                                label="Último examen dental"
                                value={data.last_dental_exam_date}
                                onChange={(v) => handleChange("last_dental_exam_date", v)}
                            />
                            <DateInput
                                label="Fecha fluoruro"
                                value={data.fluoride_date_description}
                                onChange={(v) => handleChange("fluoride_date_description", v)}
                            />
                        </>
                    ) : (
                        <>
                            <InfoItem label="Última radiografía">
                                {data.last_radiograph_date || "—"}
                            </InfoItem>
                            <InfoItem label="Último examen dental">
                                {data.last_dental_exam_date || "—"}
                            </InfoItem>
                            <InfoItem label="Fecha fluoruro">
                                {data.fluoride_date_description || "—"}
                            </InfoItem>
                        </>
                    )}
                </div>
            </Section>

            {/* =========================================================
                5. HÁBITOS ORALES
            ========================================================= */}
            <Section icon={ScanHeart} title="Hábitos Orales">
                <div className="grid grid-cols-2 gap-6">
                    {isEditing ? (
                        <>
                            <BoolInput label="¿Ha recibido fluoruro?" value={data.has_received_fluoride} onChange={(v) => handleChange("has_received_fluoride", v)} />
                            <BoolInput label="¿Sangran sus encías?" value={data.has_bleeding_gums} onChange={(v) => handleChange("has_bleeding_gums", v)} />
                            <BoolInput label="¿Tiene malos hábitos orales?" value={data.has_oral_habits} onChange={(v) => handleChange("has_oral_habits", v)} />
                            <BoolInput label="¿Mastica en ambos lados?" value={data.chews_on_both_sides} onChange={(v) => handleChange("chews_on_both_sides", v)} />
                            <BoolInput label="¿Dolor o ruido mandibular?" value={data.has_jaw_pain_or_noise} onChange={(v) => handleChange("has_jaw_pain_or_noise", v)} />
                            <BoolInput label="¿Bruxismo?" value={data.grinds_teeth} onChange={(v) => handleChange("grinds_teeth", v)} />
                            <BoolInput label="¿Respira por la boca?" value={data.breathes_through_mouth} onChange={(v) => handleChange("breathes_through_mouth", v)} />
                            <BoolInput label="¿Ortodoncia previa?" value={data.had_previous_orthodontics} onChange={(v) => handleChange("had_previous_orthodontics", v)} />
                        </>
                    ) : (
                        <>
                            <InfoItem label="¿Ha recibido fluoruro?">
                                <Bool value={data.has_received_fluoride} />
                            </InfoItem>
                            <InfoItem label="¿Sangran sus encías?">
                                <Bool value={data.has_bleeding_gums} />
                            </InfoItem>
                            <InfoItem label="¿Tiene malos hábitos orales?">
                                <Bool value={data.has_oral_habits} />
                            </InfoItem>
                            <InfoItem label="¿Mastica en ambos lados?">
                                <Bool value={data.chews_on_both_sides} />
                            </InfoItem>
                            <InfoItem label="¿Dolor o ruido mandibular?">
                                <Bool value={data.has_jaw_pain_or_noise} />
                            </InfoItem>
                            <InfoItem label="¿Bruxismo?">
                                <Bool value={data.grinds_teeth} />
                            </InfoItem>
                            <InfoItem label="¿Respira por la boca?">
                                <Bool value={data.breathes_through_mouth} />
                            </InfoItem>
                            <InfoItem label="¿Ortodoncia previa?">
                                <Bool value={data.had_previous_orthodontics} />
                            </InfoItem>
                        </>
                    )}
                </div>
            </Section>

        </div>
    );
}

/* ============================================================
   COMPONENTES PREMIUM
 ============================================================ */

function Section({ title, icon: Icon, children }) {
    return (
        <div className="
            bg-white dark:bg-secondary
            border border-slate-200 dark:border-slate-700
            rounded-2xl p-5 shadow-sm space-y-4
        ">
            <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                <Icon size={18} className="opacity-80" />
                {title}
            </h2>

            {children}
        </div>
    );
}

function InfoItem({ label, children }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
            </p>
            <div className="font-medium text-sm min-h-[1.25rem]">
                {children}
            </div>
        </div>
    );
}


function Check({ label, value }) {
    return (
        <div className="flex items-center gap-1.5 text-sm">
            {value ? (
                <CheckCircle2 className="text-green-500" size={16} />
            ) : (
                <XCircle className="text-red-500" size={16} />
            )}
            <span className="text-[13px]">{label}</span>
        </div>
    );
}

/* ============================================================
   COMPONENTES DE EDICIÓN
 ============================================================ */

function BoolInput({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900
                    ${value ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}
                `}
            >
                <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform duration-200 ease-in-out
                        ${value ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
        </div>
    );
}

function TextInput({ label, value, onChange, placeholder, type = "text" }) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1">
                {label}
            </label>
            <input
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="
                    w-full px-4 py-2 rounded-xl
                    bg-slate-50 dark:bg-slate-800/50
                    border border-slate-200 dark:border-slate-700
                    focus:ring-2 focus:ring-primary focus:border-transparent
                    text-sm transition-all
                "
            />
        </div>
    );
}

function DateInput({ label, value, onChange }) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1">
                {label}
            </label>
            <input
                type="date"
                value={value ? new Date(value).toISOString().split('T')[0] : ""}
                onChange={(e) => onChange(e.target.value)}
                className="
                    w-full px-4 py-2 rounded-xl
                    bg-slate-50 dark:bg-slate-800/50
                    border border-slate-200 dark:border-slate-700
                    focus:ring-2 focus:ring-primary focus:border-transparent
                    text-sm transition-all
                "
            />
        </div>
    );
}

function ChipInput({ label, value, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                border cursor-pointer
                ${value
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}
            `}
        >
            <div className="flex items-center gap-1.5">
                {value ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {label}
            </div>
        </button>
    );
}
