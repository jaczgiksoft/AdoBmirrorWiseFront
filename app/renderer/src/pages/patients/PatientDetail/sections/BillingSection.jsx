import { useOutletContext } from "react-router-dom";
import { Receipt, Mail, PlusCircle } from "lucide-react";

export default function BillingSection() {
    const { profile } = useOutletContext();
    const billing = profile.billing_data || [];

    return (
        <div className="space-y-6">

            {/* ===================================================
                🔷 ENCABEZADO PREMIUM FUERA DEL SECTION
            =================================================== */}
            <div className="flex items-start justify-between w-full">

                {/* IZQUIERDA: barra + icono + título + subtítulo */}
                <div className="flex items-start gap-3">
                    <div className="h-12 w-1.5 bg-primary rounded-full mt-1.5"></div>

                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <Receipt size={28} className="text-primary" />
                            <h1 className="text-3xl font-bold text-primary">
                                Datos de facturación
                            </h1>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Información fiscal asociada al paciente para emisión de comprobantes.
                        </p>
                    </div>
                </div>

                {/* DERECHA: botón premium */}
                <button
                    onClick={() => console.log("AGREGAR DATO FISCAL")}
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
                    <PlusCircle size={16} />
                    Agregar dato fiscal
                </button>
            </div>

            {/* ===================================================
                🔷 CONTENIDO DENTRO DEL SECTION
            =================================================== */}

            {billing.length === 0 ? (
                <Section>
                    <div className="flex flex-col items-center text-center py-10">

                        {/* Ícono grande */}
                        <div className="
                            w-16 h-16 rounded-full
                            bg-primary/10 text-primary
                            flex items-center justify-center
                            shadow-inner mb-4
                        ">
                            <Receipt size={36} className="opacity-80" />
                        </div>

                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                            Sin datos fiscales registrados
                        </h3>

                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                            Este paciente aún no tiene datos de facturación asociados.
                            Puedes agregar uno usando el botón “Agregar dato fiscal”.
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
                            lg:grid-cols-4
                            xl:grid-cols-5
                        "
                    >
                        {billing.map(b => (
                            <BillingCard key={b.id} b={b} />
                        ))}
                    </div>
                </Section>
            )}

        </div>
    );
}

/* ============================================================
   🔷 TARJETA PREMIUM DE FACTURACIÓN
============================================================ */
function BillingCard({ b }) {
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
            {/* Encabezado fiscal */}
            <div>
                <p className="font-semibold text-sm">
                    {b.business_name}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                    RFC: {b.rfc}
                </p>
            </div>

            {/* Datos */}
            <div className="grid grid-cols-2 gap-3 text-sm">

                <InfoItem label="Régimen">
                    {b.tax_regime || "—"}
                </InfoItem>

                <InfoItem label="Código Postal">
                    {b.zip_code || "—"}
                </InfoItem>

                <InfoItem label="Correo" icon={Mail} email>
                    {b.email || "—"}
                </InfoItem>

                <InfoItem label="Principal">
                    {b.PatientBillingData?.is_primary ? (
                        <span className="text-green-500 font-semibold text-xs">Sí</span>
                    ) : (
                        <span className="text-red-500 font-semibold text-xs">No</span>
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

function InfoItem({ label, icon: Icon, children, email }) {
    return (
        <div className="space-y-0.5 relative group">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {Icon && <Icon size={12} className="opacity-60" />}
                {label}
            </p>

            {/* Texto truncado si es email */}
            <p
                className={`font-medium text-[13px] block truncate max-w-[140px] ${email ? "cursor-help" : ""
                    }`}
            >
                {children}
            </p>

            {/* TOOLTIP */}
            {email && (
                <div
                    className="
                        opacity-0 pointer-events-none group-hover:opacity-100
                        absolute left-0 top-full z-20 mt-1
                        whitespace-nowrap

                        px-2 py-1 rounded-md text-xs font-medium
                        border shadow-md
                        transition-all duration-200

                        bg-white text-slate-700 border-slate-200
                        dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700
                    "
                >
                    {children}
                </div>
            )}
        </div>
    );
}
