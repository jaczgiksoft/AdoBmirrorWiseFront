import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function PatientDetailLayout({ sidebar, children }) {
    const navigate = useNavigate();

    return (
        <div className="flex  bg-slate-100 dark:bg-dark h-full">

            {/* SIDEBAR (FIJO) */}
            {sidebar}

            {/* CONTENEDOR DEL DETALLE */}
            <div className="flex-1 flex flex-col min-h-0">

                {/* HEADER FIJO DEL DETALLE */}
                <div
                    className="
                        flex items-center gap-2
                        px-6 py-4
                        border-b border-slate-200 dark:border-slate-700
                        bg-white dark:bg-secondary
                        sticky top-0 z-20
                    "
                >
                    <button
                        onClick={() => navigate('/patients')}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary"
                    >
                        <X size={18} />
                        <span className="font-medium">Volver al listado</span>
                    </button>
                </div>

                {/* SOLO LOS SECTIONS SON SCROLLEABLES */}
                <main className="flex-1 overflow-y-auto px-6 py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
