// app/renderer/src/modules/inventory/components/CreateEditProviderModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CreateEditProviderModal({ provider, onClose, onSave }) {
    const isEdit = !!provider;
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        contactName: "",
        rfc: "",
        phone: "",
        notes: ""
    });

    useEffect(() => {
        if (provider) {
            setFormData({
                name: provider.name || "",
                email: provider.email || "",
                contactName: provider.contactName || "",
                rfc: provider.rfc || "",
                phone: provider.phone || "",
                notes: provider.notes || ""
            });
        }
    }, [provider]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value 
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 custom-scrollbar">
                    <form id="provider-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Proveedor <span className="text-red-500">*</span></label>
                            <input 
                                required 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Contacto</label>
                                <input 
                                    name="contactName" 
                                    value={formData.contactName} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RFC</label>
                                <input 
                                    name="rfc" 
                                    value={formData.rfc} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                                <input 
                                    type="email"
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                                <input 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                            <textarea 
                                name="notes" 
                                rows={2}
                                value={formData.notes} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800/30">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition">
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="provider-form"
                        className="px-6 py-2.5 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-cyan-600/40"
                    >
                        {isEdit ? "Guardar Cambios" : "Guardar Proveedor"}
                    </button>
                </div>
            </div>
        </div>
    );
}
