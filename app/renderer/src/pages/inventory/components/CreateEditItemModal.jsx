// app/renderer/src/modules/inventory/components/CreateEditItemModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CreateEditItemModal({ item, categories, onClose, onSave }) {
    const isEdit = !!item;
    
    const [formData, setFormData] = useState({
        name: "",
        category: categories[0] || "Medical supplies",
        quantity: 0,
        unit: "pieces",
        min_stock: 0,
        notes: ""
    });

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                min_stock: item.min_stock || 0,
                notes: item.notes || ""
            });
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: ["quantity", "min_stock"].includes(name) ? Number(value) : value 
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isEdit ? "Editar Artículo" : "Nuevo Artículo"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad</label>
                            <input 
                                required 
                                name="unit" 
                                placeholder="ej. cajas, ml"
                                value={formData.unit} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Existencia {isEdit && "Actual"}</label>
                            <input 
                                type="number" 
                                required 
                                name="quantity" 
                                disabled={isEdit} // Si es edit, mejor usar Ajuste de stock.
                                title={isEdit ? "Utiliza la opción Ajustar Stock para modificar la existencia" : ""}
                                value={formData.quantity} 
                                onChange={handleChange} 
                                className={`w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white ${isEdit ? "bg-slate-200 dark:bg-slate-800 cursor-not-allowed" : "bg-slate-50 dark:bg-secondary"}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Mínimo</label>
                            <input 
                                type="number" 
                                name="min_stock" 
                                value={formData.min_stock} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas Opcionales</label>
                        <textarea 
                            name="notes" 
                            rows={3}
                            value={formData.notes} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                            Cancelar
                        </button>
                        <button type="submit" className="px-5 py-2 rounded-lg font-medium bg-cyan-600 hover:bg-cyan-700 text-white transition">
                            {isEdit ? "Guardar Cambios" : "Crear Artículo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
