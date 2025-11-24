import { NavLink } from "react-router-dom";
import { API_BASE } from "@/utils/apiBase";
import {
    FileText,
    User as UserIcon,
    Stethoscope,
    Users,
    Users2,
    Receipt,
    Calendar,
    Pill,
    FileSignature,
    ClipboardList,
    Wallet,
    BellRing,
    Sparkles,
    MessageSquare,
    StickyNote,
    Scan,
    Orbit,
    ShieldUser
} from "lucide-react";

const links = [
    { id: "summary", label: "Resumen", icon: FileText },
    { id: "general", label: "Información general", icon: UserIcon },
    { id: "clinical", label: "Historia clínica", icon: Stethoscope },
    { id: "family", label: "Grupo familiar", icon: Users },

    // 📌 NUEVOS, COLOCADOS EN ORDEN NATURAL
    { id: "representative", label: "Representantes", icon: Users2 },
    { id: "billing", label: "Datos de facturación", icon: Receipt },

    { id: "appointments", label: "Citas", icon: Calendar },
    { id: "prescriptions", label: "Recetas", icon: Pill },
    { id: "contracts", label: "Contratos", icon: FileSignature },
    { id: "treatment-plan", label: "Plan de tratamiento", icon: ClipboardList },
    { id: "budgets", label: "Presupuestos", icon: Wallet },
    { id: "alerts", label: "Alertas", icon: BellRing },
    { id: "hobbies", label: "Pasatiempos", icon: Sparkles },
    { id: "conversations", label: "Conversaciones", icon: MessageSquare },
    { id: "notes", label: "Notas", icon: StickyNote },
    { id: "odontogram", label: "Odontograma", icon: Scan },
    { id: "elastics", label: "Elásticos", icon: Orbit },
    { id: "account", label: "Cuenta", icon: ShieldUser },
];

export default function PatientSidebar({ id, profile }) {
    return (
        <aside className="w-64 p-4 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-secondary h-full">
            <div className="flex flex-col items-center mb-6">
                {profile.photo_url ? (
                    <img
                        src={`${API_BASE}/${profile.photo_url}`}
                        alt={profile.first_name}
                        className="
                w-24 h-24 rounded-xl object-cover
                border border-slate-300 dark:border-slate-700
                bg-slate-100 dark:bg-slate-800
            "
                    />
                ) : (
                    <div
                        className="
                w-24 h-24 rounded-xl border
                border-slate-300 dark:border-slate-700
                bg-slate-100 dark:bg-slate-800
                flex items-center justify-center
            "
                    >
                        <UserIcon size={48} className="text-slate-500" />
                    </div>
                )}

                <h2 className="mt-3 font-semibold text-center text-sm">
                    {profile.first_name} {profile.last_name}
                </h2>
            </div>

            <nav className="flex flex-col gap-1">
                {links.map(({ id: section, label, icon: Icon }) => (
                    <NavLink
                        key={section}
                        to={`/patients/${id}/${section}`}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                isActive
                                    ? "bg-primary text-white"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark/40"
                            }`
                        }
                    >
                        <Icon size={18} /> {label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
