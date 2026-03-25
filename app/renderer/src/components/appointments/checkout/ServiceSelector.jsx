import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, X, Loader2, Package } from "lucide-react";
import { getAllServices } from "@/services/service.service";

/**
 * ServiceSelector — Searchable combobox for selecting a service from the catalog.
 *
 * Dropdown renders via React Portal (createPortal) into document.body so it is
 * not clipped by any parent overflow:hidden (e.g. the checkout modal).
 * Position is derived from getBoundingClientRect() of the trigger element.
 *
 * Props:
 *   onSelect   {fn({id, name, price, ...})} — called when a service is confirmed
 *   disabled   {boolean}
 */
export default function ServiceSelector({ onSelect, disabled = false }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addToDebt, setAddToDebt] = useState(false);

    // refs
    const inputRef = useRef(null);
    const anchorRef = useRef(null);   // trigger wrapper — used for portal positioning
    const [dropRect, setDropRect] = useState(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const itemRefs = useRef([]);

    // ─── Fetch services on mount ─────────────────────────────
    useEffect(() => {
        let cancelled = false;
        async function fetchServices() {
            setLoading(true);
            try {
                const data = await getAllServices();
                if (!cancelled) setServices(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) setServices([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchServices();
        return () => { cancelled = true; };
    }, []);

    // ─── Close on outside click ───────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (anchorRef.current && !anchorRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // ─── Filtering ────────────────────────────────────────────
    const filtered = query.trim()
        ? services.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        : services;

    // ─── Open dropdown — measure anchor position ──────────────
    const openDropdown = useCallback(() => {
        if (!anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setDropRect(rect);
        setActiveIndex(-1);
        itemRefs.current = [];
        setOpen(true);
    }, []);

    // ─── Keyboard navigation ──────────────────────────────────
    const handleKeyDown = (e) => {
        if (!open) {
            if (e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); openDropdown(); }
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            inputRef.current?.focus();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => {
                const next = Math.min(i + 1, filtered.length - 1);
                itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
                return next;
            });
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => {
                const prev = Math.max(i - 1, 0);
                itemRefs.current[prev]?.scrollIntoView({ block: "nearest" });
                return prev;
            });
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && filtered[activeIndex]) handleSelectService(filtered[activeIndex]);
        }
    };

    // ─── Handlers ─────────────────────────────────────────────
    const handleSelectService = (svc) => {
        setSelected(svc);
        setQuery(svc.name);
        setOpen(false);
        setQuantity(1);
    };

    const handleClear = () => {
        setSelected(null);
        setQuery("");
        setQuantity(1);
        setAddToDebt(false);
        inputRef.current?.focus();
    };

    const handleAdd = () => {
        if (!selected) return;
        const qty = Math.max(1, parseInt(quantity) || 1);
        const amount = parseFloat(selected.price) * qty;
        onSelect?.({
            id: `extra-${Date.now()}-${selected.id}`,
            name: qty > 1 ? `${selected.name} x${qty}` : selected.name,
            amount,
            type: "extra",
            addedToDebt: addToDebt,
            _serviceId: selected.id,
        });
        setSelected(null);
        setQuery("");
        setQuantity(1);
        setAddToDebt(false);
    };

    const unitPrice = selected ? parseFloat(selected.price) || 0 : 0;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const totalPreview = unitPrice * qty;
    const fmt = (n) =>
        new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

    return (
        <div className="space-y-3">
            {/* ── Combobox trigger ── */}
            <div ref={anchorRef}>
                <div
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
                        open
                            ? "border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50"
                    } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                >
                    {loading
                        ? <Loader2 size={15} className="text-slate-400 shrink-0 animate-spin" />
                        : <Search size={15} className="text-slate-400 shrink-0" />
                    }
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={loading ? "Cargando servicios…" : "Buscar servicio del catálogo…"}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!e.target.value) setSelected(null);
                            setActiveIndex(-1);
                            if (!open) openDropdown();
                            else if (anchorRef.current) setDropRect(anchorRef.current.getBoundingClientRect());
                        }}
                        onFocus={() => { if (!loading) openDropdown(); }}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || loading}
                        className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none min-w-0"
                    />
                    {selected ? (
                        <button onClick={handleClear} className="text-slate-400 hover:text-red-400 transition shrink-0">
                            <X size={15} />
                        </button>
                    ) : (
                        <ChevronDown
                            size={15}
                            className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                    )}
                </div>
            </div>

            {/* ── Portal dropdown — rendered into document.body ── */}
            {open && !loading && dropRect && createPortal(
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "fixed",
                        top: dropRect.bottom + 4,
                        left: dropRect.left,
                        width: dropRect.width,
                        zIndex: 9999,
                    }}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
                >
                    <div className="max-h-56 overflow-y-auto custom-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm gap-2">
                                <Package size={24} className="opacity-30" />
                                <span>Sin resultados{query ? ` para "${query}"` : ""}</span>
                            </div>
                        ) : (
                            filtered.map((svc, idx) => (
                                <button
                                    key={svc.id}
                                    ref={(el) => { itemRefs.current[idx] = el; }}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // prevent input blur before selection
                                        handleSelectService(svc);
                                    }}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition ${
                                        idx === activeIndex
                                            ? "bg-primary/10 dark:bg-primary/20"
                                            : selected?.id === svc.id
                                                ? "bg-primary/5 dark:bg-primary/10"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {svc.color && (
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: svc.color }}
                                            />
                                        )}
                                        <span className="truncate text-slate-700 dark:text-slate-200 font-medium">
                                            {svc.name}
                                        </span>
                                    </div>
                                    <span className="text-slate-400 text-xs font-semibold shrink-0 ml-3">
                                        {fmt(svc.price)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* ── Quantity + Debt + Total preview ── */}
            {selected && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {selected.name}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 ml-3">
                            {fmt(unitPrice)} / u
                        </span>
                    </div>

                    <div className="px-4 py-3 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                Cantidad
                            </label>
                            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-700">
                                <button
                                    onClick={() => setQuantity((q) => Math.max(1, (parseInt(q) || 1) - 1))}
                                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition font-bold text-sm select-none"
                                >−</button>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-10 text-center text-sm font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none [appearance:textfield]"
                                />
                                <button
                                    onClick={() => setQuantity((q) => (parseInt(q) || 1) + 1)}
                                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition font-bold text-sm select-none"
                                >+</button>
                            </div>
                        </div>
                        <div className="flex-1 text-right">
                            <span className="text-xs text-slate-400">Total</span>
                            <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                                {fmt(totalPreview)}
                            </p>
                        </div>
                    </div>

                    <div className="px-4 pb-3 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={addToDebt}
                                onChange={(e) => setAddToDebt(e.target.checked)}
                                className="accent-primary"
                            />
                            Agregar a deuda (no cobrar ahora)
                        </label>
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:bg-sky-600 transition active:scale-95 shrink-0"
                        >
                            + Agregar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
