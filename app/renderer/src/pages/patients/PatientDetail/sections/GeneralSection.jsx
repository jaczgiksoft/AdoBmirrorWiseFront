import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
    UserCircle,
    Phone,
    Mail,
    MapPin,
    Landmark,
    IdCard,
    Building2,
    KeyRound,
    Users,
    User2,
    Receipt,
    Pencil,
} from "lucide-react";

import { API_BASE } from "@/utils/apiBase";
import PatientGeneralEditModal from "./components/PatientGeneralEditModal";

export default function GeneralSection() {
    const { profile, refreshProfile } = useOutletContext();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    return (
        <div className="space-y-10 text-slate-800 dark:text-slate-200">

            {/* =====================================================
                HEADER PREMIUM — IDENTIDAD COMPLETA
            ===================================================== */}
            <div className="
                bg-white dark:bg-secondary
                border border-slate-200 dark:border-slate-700
                rounded-2xl p-8 shadow-sm
                space-y-6
            ">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">

                        {/* FOTO */}
                        <div className="relative">
                            {profile.photo_url ? (
                                <img
                                    src={`${API_BASE}/${profile.photo_url}`}
                                    alt={profile.first_name}
                                    className="w-24 h-24 rounded-2xl object-cover border border-slate-300 dark:border-slate-700 shadow"
                                />
                            ) : (
                                <div className="
                                    w-24 h-24 rounded-2xl border
                                    border-slate-300 dark:border-slate-700
                                    bg-slate-100 dark:bg-slate-800
                                    flex items-center justify-center shadow
                                ">
                                    <UserCircle size={60} className="text-slate-500" />
                                </div>
                            )}
                        </div>

                        {/* INFORMACIÓN PRINCIPAL */}
                        <div className="flex-1 space-y-1">
                            <h1 className="text-3xl font-bold text-primary">
                                {profile.first_name} {profile.last_name} {profile.middle_name || ""}
                            </h1>

                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Expediente: <strong className="text-primary">{profile.medical_record_number}</strong> •{" "}
                                Código familiar: <strong className="text-primary">{profile.family_code}</strong>
                            </p>

                            {profile.types?.length > 0 && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {profile.types.map(t => (
                                        <span
                                            key={t.id}
                                            className="px-3 py-1 rounded-full text-xs text-white font-medium shadow"
                                            style={{ background: t.color }}
                                        >
                                            {t.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-medium rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                        <Pencil size={16} />
                        <span>Editar</span>
                    </button>
                </div>

                <PatientGeneralEditModal
                    open={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    profile={profile}
                    refreshProfile={refreshProfile}
                />

                <Divider />

                {/* MINI GRID DE IDENTIDAD */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <InfoItem label="Género" icon={UserCircle}>
                        {profile.genre === "male" ? "Hombre" :
                            profile.genre === "female" ? "Mujer" : "Otro"}
                    </InfoItem>

                    <InfoItem label="Fecha de nacimiento" icon={IdCard}>
                        {profile.birth_date}
                    </InfoItem>

                    <InfoItem label="Estado civil" icon={Users}>
                        {profile.marital_status || "—"}
                    </InfoItem>

                    <InfoItem label="Alias / Nickname" icon={IdCard}>
                        {profile.nickname || "—"}
                    </InfoItem>
                </div>
            </div>


            {/* ===============================
                📞 CONTACTO + 🏠 DIRECCIÓN
            =============================== */}
            <div className="grid grid-cols-2 gap-8">

                {/* ==========================
                    📞 CONTACTO (2x2)
                =========================== */}
                <Section icon={Phone} title="Contacto">
                    <div className="grid grid-cols-2 gap-6">

                        <InfoItem label="Teléfono" icon={Phone}>
                            {profile.phone_number}
                        </InfoItem>

                        <InfoItem label="Correo" icon={Mail}>
                            {profile.email || "—"}
                        </InfoItem>

                        <InfoItem label="Ocupación" icon={Building2}>
                            {profile.occupation?.name || "—"}
                        </InfoItem>

                        <InfoItem label="Referido por" icon={Users}>
                            {profile.referral?.name || "—"}
                        </InfoItem>

                    </div>
                </Section>

                {/* ==========================
                    🏠 DIRECCIÓN (2x2)
                =========================== */}
                <Section icon={MapPin} title="Dirección">
                    <div className="grid grid-cols-2 gap-6">

                        <InfoItem label="Calle" icon={MapPin}>
                            {profile.address_street_name} #{profile.address_street_number}
                        </InfoItem>

                        <InfoItem label="Colonia" icon={Landmark}>
                            {profile.address_neighborhood || "—"}
                        </InfoItem>

                        <InfoItem label="Ciudad / Estado" icon={MapPin}>
                            {profile.address_city}, {profile.address_state}
                        </InfoItem>

                        <InfoItem label="País / Código Postal" icon={MapPin}>
                            {profile.address_country} ({profile.address_zip_code})
                        </InfoItem>

                    </div>
                </Section>

            </div>



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
            rounded-2xl p-8 shadow-sm
            space-y-6
        ">
            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                <Icon size={22} className="opacity-80" />
                {title}
            </h2>

            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

function InfoItem({ label, icon: Icon, children }) {
    return (
        <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Icon size={14} className="opacity-60" />
                {label}
            </p>
            <p className="font-medium">{children}</p>
        </div>
    );
}

function Divider() {
    return <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />;
}
