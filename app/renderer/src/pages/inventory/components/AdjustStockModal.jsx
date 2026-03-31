// app/renderer/src/modules/inventory/components/AdjustStockModal.jsx
import React, { useState, useEffect } from "react";
import { X, ArrowDown, ArrowUp } from "lucide-react";

export default function AdjustStockModal({ item, movementTypes = [], providers = [], onClose, onSave }) {
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState(movementTypes[0] || "Entrada");
    const [reference, setReference] = useState("");
    const [providerId, setProviderId] = useState("");
    const [unitCost, setUnitCost] = useState("");

    const parsedAmount = parseInt(amount, 10) || 0;
    const newStock = Number(item.quantity) + parsedAmount;

    // Filtrar opciones según el signo
    const filteredOptions = movementTypes.filter(type => {
        if (parsedAmount > 0) return type === "Entrada";
        if (parsedAmount < 0) return ["Salida", "Merma", "Devolucion", "Caducado"].includes(type);
        return true; // Si es 0, mostrar todos o dejar que el usuario decida
    });

    // Auto-seleccionar un motivo válido si el actual ya no está en la lista filtrada
    useEffect(() => {
        if (parsedAmount !== 0 && !filteredOptions.includes(reason)) {
            setReason(filteredOptions[0] || "");
        }
    }, [parsedAmount, filteredOptions, reason]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (parsedAmount !== 0) {
            onSave(parsedAmount, reason, reference, providerId, parseFloat(unitCost) || 0);
        }
    };

    const handleQuickAdd = (val) => {
        setAmount(prev => {
            const current = parseInt(prev, 10) || 0;
            const next = current + val;
            if (next === 0) return "";
            return next.toString();
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Ajustar Existencia
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="text-center mb-6">
                        <p className="text-sm tracking-wide text-slate-500 font-medium">ARTÍCULO</p>
                        <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{item.name}</p>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Actual</p>
                            <p className="text-xl font-bold">{item.quantity}</p>
                        </div>
                        <div className="text-slate-400">
                            {parsedAmount < 0 ? <ArrowDown className="text-red-500" /> : parsedAmount > 0 ? <ArrowUp className="text-green-500" /> : "→"}
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Nueva</p>
                            <p className={`text-xl font-bold ${newStock < 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                {newStock}
                            </p>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ajuste (±)</label>
                            <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => handleQuickAdd(-5)} className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-300 transition">-5</button>
                                <button type="button" onClick={() => handleQuickAdd(-1)} className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-300 transition">-1</button>
                                <button type="button" onClick={() => handleQuickAdd(1)} className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-300 transition">+1</button>
                                <button type="button" onClick={() => handleQuickAdd(5)} className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-xs font-medium text-slate-700 dark:text-slate-300 transition">+5</button>
                            </div>
                        </div>
                        <input 
                            type="text" 
                            required 
                            autoFocus
                            value={amount} 
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^-?\d*$/.test(val)) { // Validates empty, negative sign alone, or full number
                                    setAmount(val);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "+" || e.key === "-") {
                                    e.preventDefault();
                                    handleQuickAdd(e.key === "+" ? 1 : -1);
                                }
                            }}
                            placeholder="Ej: 5, -3"
                            className="w-full px-4 py-2 text-center text-lg bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                        />
                        <p className="text-xs text-slate-500 mt-2">Usa número positivo para agregar o negativo para reducir.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo <span className="text-red-500">*</span></label>
                        <select 
                            required
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)} 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                        >
                            {filteredOptions.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {(reason === "Entrada" || reason === "Devolucion") && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Costo Unitario <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        value={unitCost} 
                                        onChange={(e) => setUnitCost(e.target.value)} 
                                        className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proveedor (Opcional)</label>
                                <select 
                                    value={providerId} 
                                    onChange={(e) => setProviderId(e.target.value)} 
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                >
                                    <option value="">-- Sin proveedor --</option>
                                    {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referencia (Opcional)</label>
                        <input 
                            type="text" 
                            placeholder="Ej. Factura F-102, Lote dañado..."
                            value={reference} 
                            onChange={(e) => setReference(e.target.value)} 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={!amount || amount === "+" || amount === "-" || parsedAmount === 0 || newStock < 0 || !reason}
                            className="w-full py-2.5 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirmar Ajuste
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
