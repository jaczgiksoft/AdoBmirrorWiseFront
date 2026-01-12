import { useOutletContext } from "react-router-dom";
import { User2, UserPlus, Phone, Mail } from "lucide-react";

export default function RepresentativesSection() {
    const { profile } = useOutletContext();
    const reps = profile.representatives || [];

    return (
        <div className="space-y-6">

            {/* ===================================================
                🔷 ENCABEZADO PREMIUM FUERA DEL SECTION
            =================================================== */}
            {/* ===================================================
                🔷 ENCABEZADO PREMIUM FUERA DEL SECTION
            =================================================== */}
            <div className="flex items-start justify-between w-full">

                {/* IZQUIERDA: barra + icono + Título + Subtítulo */}
                <div className="flex items-start gap-3">

                    {/* Barra vertical */}
                    <div className="h-12 w-1.5 bg-primary rounded-full mt-1.5"></div>

                    {/* Título + subtítulo */}
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <User2 size={28} className="text-primary" />
                            <h1 className="text-3xl font-bold text-primary">
                                Representantes
                            </h1>
                        </div>

                        {/* Subtítulo */}
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Contactos responsables asociados al paciente.
                        </p>
                    </div>
                </div>

                {/* DERECHA: Botón premium */}
                <button
                    onClick={() => console.log("AGREGAR REPRESENTANTE")}
                    className="
            flex items-center gap-2
            px-4 py-2
            bg-primary/10 text-primary
            rounded-xl shadow-sm
            text-sm font-medium
            hover:bg-primary hover:text-white
            active:scale-[0.97]
            transition-all duration-150 cursor-pointer"
                >
                    <UserPlus size={16} />
                    Agregar representante
                </button>
            </div>


            {/* ===================================================
                🔷 CONTENIDO DENTRO DEL SECTION
            =================================================== */}

            {reps.length === 0 ? (
                <Section>
                    <div className="flex flex-col items-center text-center py-10">

                        {/* Ícono grande premium */}
                        <div className="
                w-16 h-16 rounded-full
                bg-primary/10 text-primary
                flex items-center justify-center
                shadow-inner mb-4
            ">
                            <User2 size={36} className="opacity-80" />
                        </div>

                        {/* Título pequeño elegante */}
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                            Sin representantes registrados
                        </h3>

                        {/* Descripción suave */}
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                            Este paciente aún no tiene representantes o contactos responsables asociados.
                            Puedes agregar uno usando el botón "<strong>Agregar representante</strong>".
                        </p>

                    </div>
                </Section>
            ) : (
                <Section>
                    <div
                        className="
                grid gap-5
                grid-cols-1
                md:grid-cols-3
                lg:grid-cols-5
                xl:grid-cols-6
            "
                    >
                        {reps.map(r => (
                            <RepresentativeCard key={r.id} rep={r} />
                        ))}
                    </div>
                </Section>
            )}

        </div>
    );
}

/* ============================================================
   🔷 TARJETA PREMIUM DE REPRESENTANTE
============================================================ */
function RepresentativeCard({ rep }) {

    const initials = rep.full_name
        .split(" ")
        .map(p => p.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2);

    return (
        <div
            className="
                group
                rounded-xl border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800
                shadow-sm p-4
                transition-all duration-200
                hover:shadow-md space-y-3
            "
        >
            <div className="flex items-center gap-3">
                <div
                    className="
                        w-12 h-12 rounded-full
                        bg-primary/10 text-primary
                        flex items-center justify-center
                        text-sm font-bold
                        shadow-inner
                    "
                >
                    {initials}
                </div>

                <div className="flex-1">
                    <p className="font-semibold text-sm">{rep.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {rep.relationship}
                    </p>
                </div>
            </div>

            <div className="space-y-1 text-sm">
                <InfoItem label="Teléfono" icon={Phone}>
                    {rep.phone || "—"}
                </InfoItem>

                <InfoItem label="Correo" icon={Mail}>
                    {rep.email || "—"}
                </InfoItem>

                <InfoItem label="Acceso">
                    {rep.can_login ? (
                        <span className="text-green-500 font-semibold">Sí</span>
                    ) : (
                        <span className="text-red-500 font-semibold">No</span>
                    )}
                </InfoItem>
            </div>
        </div>
    );
}

/* ============================================================
   🔷 COMPONENTES BASE (SECTION + INFOITEM)
============================================================ */

function Section({ children }) {
    return (
        <div className="
            bg-white dark:bg-secondary
            border border-slate-200 dark:border-slate-700
            rounded-2xl p-5 shadow-sm space-y-4
        ">
            {children}
        </div>
    );
}

function InfoItem({ label, icon: Icon, children }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {Icon && <Icon size={12} className="opacity-60" />}
                {label}
            </p>
            <p className="font-medium text-[13px]">{children}</p>
        </div>
    );
}
