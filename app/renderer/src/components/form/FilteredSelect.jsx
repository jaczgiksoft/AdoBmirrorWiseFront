import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";

/**
 * Select filtrable tipo Select2, con buscador interno
 */
export default function FilteredSelect({
                                           label,
                                           options = [],
                                           value,
                                           onChange,
                                           placeholder = "Seleccionar...",
                                           required = false,
                                           name,
                                           error,
                                       }) {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const selected = options.find((opt) => String(opt.id) === String(value));

    // 🔹 Cierra al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 🔹 Enfocar el input cuando se abre
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setHighlightedIndex(0);
        }
    }, [open]);

    const filteredOptions = options.filter((opt) =>
        opt.name.toLowerCase().includes(filter.toLowerCase())
    );

    // 🔹 Manejar navegación por teclado
    const handleKeyDown = (e) => {
        if (!open) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((i) =>
                i < filteredOptions.length - 1 ? i + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((i) =>
                i > 0 ? i - 1 : filteredOptions.length - 1
            );
        } else if (e.key === "Enter") {
            e.preventDefault();
            const opt = filteredOptions[highlightedIndex];
            if (opt) {
                onChange(opt.id);
                setOpen(false);
                wrapperRef.current?.focus();
            }
        } else if (e.key === "Tab") {
            setOpen(false);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            wrapperRef.current?.focus();
        }
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {label && (
                <label
                    className={`block text-sm mb-1.5 ${
                        required ? "label-required" : ""
                    } text-slate-300`}
                >
                    {label}
                </label>
            )}

            {/* 🔹 Contenedor principal */}
            <div
                tabIndex={0}
                onFocus={() => setOpen(true)} // abre al tabular
                onMouseDown={(e) => {
                    e.preventDefault(); // evita perder el foco
                    setOpen((prev) => !prev); // alterna manualmente con clic
                }}
                onBlur={(e) => {
                    if (!wrapperRef.current?.contains(e.relatedTarget)) {
                        setTimeout(() => setOpen(false), 100);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpen((prev) => !prev);
                    }
                }}
                className={`flex items-center justify-between rounded-lg border ${
                    error
                        ? "border-error ring-1 ring-error/50"
                        : "border-slate-700 hover:border-primary"
                } px-3 py-2 text-sm text-slate-200 cursor-pointer transition bg-dark focus:outline-none focus:ring-2 focus:ring-primary/60`}
            >
                <span className={`${!selected ? "text-slate-500" : ""}`}>
                    {selected ? selected.name : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`transition-transform ${
                        open ? "rotate-180 text-primary" : "text-slate-400"
                    }`}
                />
            </div>

            {/* 🔹 Menú desplegable */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={listRef}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-50 w-full bg-dark border border-slate-700 rounded-lg mt-1 shadow-lg"
                        onKeyDown={handleKeyDown}
                    >
                        <div className="relative border-b border-slate-700">
                            <Search
                                size={14}
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Buscar..."
                                value={filter}
                                onChange={(e) => {
                                    setFilter(e.target.value);
                                    setHighlightedIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-dark text-slate-200 text-sm rounded-t-lg pl-7 pr-3 py-2 outline-none placeholder:text-slate-500"
                            />
                        </div>

                        <div className="max-h-40 overflow-y-auto text-sm">
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-2 text-slate-400 text-center">
                                    Sin resultados
                                </div>
                            ) : (
                                filteredOptions.map((opt, i) => (
                                    <div
                                        key={opt.id}
                                        onMouseEnter={() => setHighlightedIndex(i)}
                                        onClick={() => {
                                            onChange(opt.id);
                                            setOpen(false);
                                            wrapperRef.current?.focus();
                                        }}
                                        className={`px-3 py-2 cursor-pointer transition-colors ${
                                            i === highlightedIndex
                                                ? "bg-primary/40 text-white"
                                                : String(opt.id) === String(value)
                                                    ? "bg-primary/20 text-white"
                                                    : "text-slate-200 hover:bg-primary/20"
                                        }`}
                                    >
                                        {opt.name}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
