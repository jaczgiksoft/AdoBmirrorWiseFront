import React, { useState } from "react";
import { ChromePicker } from "react-color";
import Modal from "@/components/ui/Modal";
import { RefreshCw } from "lucide-react";

/**
 * BwiseColorPicker - A reusable color picker component for BWISE apps.
 * 
 * @param {string} color - Current hex color value
 * @param {function} onChange - Callback function(color)
 * @param {string} label - Optional label to display above the button
 */
export default function BwiseColorPicker({ color, onChange, label = "Color" }) {
    const [isOpen, setIsOpen] = useState(false);

    const quickColors = [
        "#EF4444", // Rojo
        "#3B82F6", // Azul
        "#10B981", // Verde
        "#F59E0B", // Ámbar
        "#6366F1", // Índigo
        "#8B5CF6", // Violeta
        "#EC4899", // Rosa
        "#06B6D4", // Cian
        "#F97316", // Naranja
        "#000000", // Negro
        "#FFFFFF", // Blanco
        "#64748B", // Pizarra
    ];

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const handleRandomColor = () => {
        const random = getRandomColor();
        onChange({ hex: random });
    };

    return (
        <div className="flex flex-col">
            {label && <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="p-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary transition-all duration-200 w-full h-10 flex items-center justify-center group"
            >
                <div
                    className="w-full h-full rounded-md shadow-inner border border-black/5 group-hover:scale-[0.98] transition-transform"
                    style={{ background: color || "#CCCCCC" }}
                />
            </button>

            <Modal
                open={isOpen}
                onClose={() => setIsOpen(false)}
                title="Seleccionar Color"
                widthClass="w-[450px]"
                closeOnBackdrop={true}
            >
                <div className="flex flex-col gap-8">
                    {/* Sección de Colores Rápidos */}
                    <div>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
                            Colores Rápidos
                        </h3>
                        <div className="grid grid-cols-6 gap-3">
                            {quickColors.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                        onChange({ hex: c });
                                        // No cerramos el modal para permitir ajustar después en el custom picker
                                    }}
                                    className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shadow-sm ${
                                        color?.toUpperCase() === c.toUpperCase()
                                            ? "border-primary ring-2 ring-primary/20 scale-110"
                                            : "border-white dark:border-slate-800"
                                    }`}
                                    style={{ background: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sección de Color Personalizado */}
                    <div className="flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-4">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Color Personalizado
                            </h3>
                            <button
                                type="button"
                                onClick={handleRandomColor}
                                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-sky-500 transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full"
                            >
                                <RefreshCw size={14} />
                                Color Aleatorio
                            </button>
                        </div>
                        
                        <div className="w-full bwise-chrome-picker-container bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <ChromePicker
                                color={color || "#CCCCCC"}
                                onChange={onChange}
                                disableAlpha={true}
                                styles={{
                                    default: {
                                        picker: {
                                            width: "100%",
                                            boxShadow: "none",
                                            borderRadius: "12px",
                                            background: "transparent",
                                            transform: "scale(1.1)",
                                            transformOrigin: "center"
                                        },
                                        body: {
                                            padding: "12px",
                                            background: "transparent"
                                        },
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Botón de Confirmar */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-sky-500 transition-all active:scale-[0.98]"
                    >
                        Confirmar Selección
                    </button>
                </div>
            </Modal>
        </div>
    );
}
