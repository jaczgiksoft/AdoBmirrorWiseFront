import { useOutletContext } from "react-router-dom";
import {
    Pill,
    HeartPulse,
    Calendar,
    Baby,
    Syringe,
    Stethoscope,
    ClipboardList,
    CheckCircle2,
    XCircle,
    ScanHeart,
} from "lucide-react";

export default function ClinicalSection() {
    const { profile } = useOutletContext();

    /** Utilidad para booleanos */
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

    return (
        <div className="space-y-10 text-slate-800 dark:text-slate-200">

            {/* HEADER PREMIUM CON EDITAR */}
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

                <button
                    onClick={() => console.log("EDITAR HISTORIA CLÍNICA")}
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
            </div>

            {/* =========================================================
                1. TRATAMIENTOS Y MEDICACIÓN
            ========================================================= */}
            <Section icon={Pill} title="Tratamientos y Medicación">
                <div className="grid grid-cols-2 gap-4">

                    <InfoItem label="¿Bajo tratamiento médico?">
                        <Bool value={profile.is_under_medical_treatment} />
                    </InfoItem>

                    <InfoItem label="¿Toma medicamentos?">
                        <Bool value={profile.is_taking_medication} />
                    </InfoItem>

                    <InfoItem label="¿Alergia a medicamentos?">
                        <Bool value={profile.is_allergic_to_medication} />
                    </InfoItem>

                    <InfoItem label="Descripción de alergias">
                        {profile.allergies_description || "—"}
                    </InfoItem>
                </div>

                {/* Texto opcional */}
                {(profile.current_treatment_description || profile.current_medications) && (
                    <div className="mt-4 grid grid-cols-2 gap-6">

                        {profile.current_treatment_description && (
                            <InfoItem label="Tratamiento actual">
                                {profile.current_treatment_description}
                            </InfoItem>
                        )}

                        {profile.current_medications && (
                            <InfoItem label="Medicamentos actuales">
                                {profile.current_medications}
                            </InfoItem>
                        )}
                    </div>
                )}
            </Section>

            {/* =========================================================
                2. CONDICIONES MÉDICAS (CHECKLIST TIPO SUMMARY)
            ========================================================= */}
            <Section icon={HeartPulse} title="Condiciones Médicas">
                <div className="grid grid-cols-3 gap-x-6 gap-y-3">

                    <Check label="Hepatitis" value={profile.has_hepatitis} />
                    <Check label="Diabetes" value={profile.has_diabetes} />
                    <Check label="Pulmonares" value={profile.has_lung_conditions} />
                    <Check label="Migrañas" value={profile.has_migraines} />
                    <Check label="Amigdalitis" value={profile.has_amigdalitis} />
                    <Check label="Adenoiditis" value={profile.has_adenoiditis} />
                    <Check label="Epilepsia" value={profile.has_epilepsy} />
                    <Check label="Fiebre reumática" value={profile.has_rheumatic_fever} />
                    <Check label="Psicológicas" value={profile.has_psychological_conditions} />
                    <Check label="Cardiacas" value={profile.has_heart_conditions} />
                    <Check label="Hemofilia" value={profile.has_hemophilia} />
                    <Check label="Enfermedades venéreas (ETS)" value={profile.has_stds} />

                </div>
            </Section>

            {/* =========================================================
                3. EMBARAZO — SOLO PARA FEMENINO
            ========================================================= */}
            {profile.genre === "female" && (
                <Section icon={Baby} title="Embarazo">
                    <div className="grid grid-cols-2 gap-6">

                        <InfoItem label="¿Está embarazada?">
                            <Bool value={profile.is_pregnant} />
                        </InfoItem>

                        <InfoItem label="Semanas de embarazo">
                            {profile.pregnancy_weeks || "—"}
                        </InfoItem>

                    </div>
                </Section>
            )}

            {/* =========================================================
                4. FECHAS CLÍNICAS
            ========================================================= */}
            <Section icon={Calendar} title="Fechas Clínicas">
                <div className="grid grid-cols-2 gap-6">

                    <InfoItem label="Última radiografía">
                        {profile.last_radiograph_date || "—"}
                    </InfoItem>

                    <InfoItem label="Último examen dental">
                        {profile.last_dental_exam_date || "—"}
                    </InfoItem>

                    {profile.has_received_fluoride && (
                        <InfoItem label="Fecha fluoruro">
                            {profile.fluoride_date_description || "—"}
                        </InfoItem>
                    )}
                </div>
            </Section>

            {/* =========================================================
                5. HÁBITOS ORALES
            ========================================================= */}
            <Section icon={ScanHeart} title="Hábitos Orales">
                <div className="grid grid-cols-2 gap-6">

                    <InfoItem label="¿Ha recibido fluoruro?">
                        <Bool value={profile.has_received_fluoride} />
                    </InfoItem>

                    <InfoItem label="¿Sangran sus encías?">
                        <Bool value={profile.has_bleeding_gums} />
                    </InfoItem>

                    <InfoItem label="¿Tiene malos hábitos orales?">
                        <Bool value={profile.has_oral_habits} />
                    </InfoItem>

                    <InfoItem label="¿Mastica en ambos lados?">
                        <Bool value={profile.chews_on_both_sides} />
                    </InfoItem>

                    <InfoItem label="¿Dolor o ruido mandibular?">
                        <Bool value={profile.has_jaw_pain_or_noise} />
                    </InfoItem>

                    <InfoItem label="¿Bruxismo?">
                        <Bool value={profile.grinds_teeth} />
                    </InfoItem>

                    <InfoItem label="¿Respira por la boca?">
                        <Bool value={profile.breathes_through_mouth} />
                    </InfoItem>

                    <InfoItem label="¿Ortodoncia previa?">
                        <Bool value={profile.had_previous_orthodontics} />
                    </InfoItem>

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
            <p className="font-medium text-sm">
                {children}
            </p>
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

