import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const range = [];
    const maxButtons = 7; // cantidad máxima visible
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);

    for (let i = start; i <= end; i++) range.push(i);

    if (start > 1) range.unshift("...");
    if (end < totalPages) range.push("...");

    return (
        <div className="flex justify-center items-center gap-2 py-6 border-t border-slate-700 mt-6 select-none">
            {/* ⏮️ Ir al principio */}
            <button
                onClick={() => onPageChange(1)}
                disabled={page === 1}
                className="flex items-center gap-1 text-slate-400 hover:text-primary disabled:opacity-40 transition text-sm cursor-pointer"
            >
                <ChevronsLeft size={14} />
                <span>Primero</span>
            </button>

            {/* ← Anterior */}
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 text-slate-400 hover:text-primary disabled:opacity-40 transition text-sm cursor-pointer"
            >
                <ChevronLeft size={14} />
                <span>Anterior</span>
            </button>

            {/* 🔢 Botones numéricos */}
            <div className="flex items-center gap-2">
                {range.map((num, idx) =>
                    num === "..." ? (
                        <span key={idx} className="text-slate-500">…</span>
                    ) : (
                        <button
                            key={num}
                            onClick={() => onPageChange(num)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 cursor-pointer
                                ${
                                num === page
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-slate-400 hover:text-primary"
                            }`}
                        >
                            {num}
                        </button>
                    )
                )}
            </div>

            {/* → Siguiente */}
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-slate-400 hover:text-primary disabled:opacity-40 transition text-sm cursor-pointer"
            >
                <span>Siguiente</span>
                <ChevronRight size={14} />
            </button>

            {/* ⏭️ Ir al final */}
            <button
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-slate-400 hover:text-primary disabled:opacity-40 transition text-sm cursor-pointer"
            >
                <span>Último</span>
                <ChevronsRight size={14} />
            </button>
        </div>
    );
}
