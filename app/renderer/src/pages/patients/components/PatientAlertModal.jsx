import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function PatientAlertModal({ open, onClose, onSave, alert }) {
    const firstRef = useRef(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        is_admin_alert: false,
    });

    useEffect(() => {
        if (alert) setForm(alert);
        else setForm({ title: "", description: "", is_admin_alert: false });
    }, [alert]);

    useEffect(() => {
        if (open) firstRef.current?.focus();
    }, [open]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    };

    const handleConfirm = () => {
        if (!form.title.trim()) return;

        onSave(form);

        // Limpia el formulario después de guardar
        setForm({
            title: "",
            description: "",
            is_admin_alert: false,
        });
    };

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="bg-secondary rounded-xl border border-slate-700 p-6 w-[450px]"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-primary">
                        {alert ? "Editar alerta" : "Nueva alerta"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-1 label-required">Título</label>
                        <input
                            ref={firstRef}
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Descripción</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="input resize-none"
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="is_admin_alert"
                            checked={form.is_admin_alert}
                            onChange={handleChange}
                        />
                        <span>¿Es alerta administrativa?</span>
                    </label>
                </div>

                {/* Footer */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={onClose}
                        className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleConfirm}
                        className="px-3 py-2 rounded-lg bg-primary text-white"
                    >
                        Guardar
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
