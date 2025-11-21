import { motion } from "framer-motion";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useEffect, useState } from "react";

export default function PatientTypeSelectorModal({ open, onClose, onSelect }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (open) setIndex(0);
    }, [open]);

    useHotkeys(
        open
            ? {
                arrowdown: (e) => {
                    e.preventDefault();
                    setIndex((prev) => (prev === 0 ? 1 : 0));
                    return "prevent";
                },
                arrowup: (e) => {
                    e.preventDefault();
                    setIndex((prev) => (prev === 0 ? 1 : 0));
                    return "prevent";
                },
                enter: (e) => {
                    e.preventDefault();
                    const type = index === 0 ? "prospecto" : "consulta_unica";
                    onSelect(type);
                    return "prevent";
                },
                escape: (e) => {
                    e.preventDefault();
                    onClose();
                    return "prevent";
                },
            }
            : {},
        [open, index]
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-secondary rounded-2xl p-6 w-[400px] border border-slate-700 shadow-xl"
            >
                <h3 className="text-lg font-semibold text-primary mb-4">
                    Tipo de paciente
                </h3>

                <p className="text-sm text-slate-300 mb-6">
                    Selecciona el tipo de paciente que deseas registrar.
                </p>

                <div className="flex flex-col gap-3">

                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            index === 0
                                ? "bg-primary text-white ring-2 ring-primary/40 scale-[1.03]"
                                : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                        }`}
                        onClick={() => onSelect("prospecto")}
                    >
                        Prospecto
                    </button>

                    <button
                        className={`px-4 py-2 rounded-lg transition ${
                            index === 1
                                ? "bg-primary text-white ring-2 ring-primary/40 scale-[1.03]"
                                : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                        }`}
                        onClick={() => onSelect("consulta_unica")}
                    >
                        Consulta única
                    </button>

                    <button
                        className="px-4 py-2 text-slate-400 hover:text-white"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
