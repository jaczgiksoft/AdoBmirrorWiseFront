// app/renderer/src/modules/inventory/components/CreateEditItemModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { API_BASE } from "@/utils/apiBase";
import { DateInput } from "@/components/inputs";

export default function CreateEditItemModal({ item, categories, unitTypes, onClose, onSave }) {
    const isEdit = !!item;
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        image: null,
        sku: "",
        name: "",
        description: "",
        category: categories?.[0] || "Medicamentos",
        quantity: "",
        unit: unitTypes?.[0] || "Pieza",
        min_stock: "",
        purchasePrice: "",
        salePrice: "",
        lotNumber: "",
        expiryDate: "",
        notes: ""
    });

    useEffect(() => {
        if (item) {
            setFormData({
                image: null, // Reset image to null, we'll use item.image for existing
                sku: item.sku || "",
                name: item.name,
                description: item.description || "",
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                min_stock: item.min_stock || 0,
                purchasePrice: item.purchasePrice || 0,
                salePrice: item.salePrice || 0,
                lotNumber: item.lotNumber || "",
                expiryDate: item.expiryDate || "",
                notes: item.notes || ""
            });

            if (item.image) {
                // If it's a full URL or base64 already
                if (item.image.startsWith('http') || item.image.startsWith('data:')) {
                    setImagePreview(item.image);
                } else {
                    // It's a relative path from the backend.
                    setImagePreview(`${API_BASE}/${item.image}`);
                }
            }
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ["quantity", "min_stock", "purchasePrice", "salePrice"].includes(name) 
                ? (value === "" ? "" : Number(value)) 
                : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isEdit ? "Editar Artículo" : "Nuevo Artículo"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 custom-scrollbar">
                    <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
                        {/* Area de Imagen */}
                        <div className="flex items-start gap-5">
                            <div className="shrink-0 flex flex-col items-center gap-2">
                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 relative group">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-slate-400 flex flex-col items-center">
                                            <ImageIcon size={28} className="mb-1 opacity-50" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Imagen</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                                >
                                    <Upload size={14} /> Subir Foto
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                />
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código/SKU <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                    <textarea
                                        name="description"
                                        rows={2}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
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
                                    {categories?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            {formData.category && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad de Medida <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                    >
                                        {unitTypes?.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Compra</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="purchasePrice"
                                        placeholder="0"
                                        value={formData.purchasePrice}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Venta</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="salePrice"
                                        placeholder="0"
                                        value={formData.salePrice}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {formData.category === "Medicamentos" && (
                            <div className="grid grid-cols-2 gap-4 bg-cyan-50 dark:bg-cyan-900/10 p-4 rounded-xl border border-cyan-100 dark:border-cyan-900/30">
                                <div>
                                    <label className="block text-sm font-medium text-cyan-900 dark:text-cyan-100 mb-1">No. de Lote</label>
                                    <input
                                        name="lotNumber"
                                        value={formData.lotNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <DateInput
                                        label="Fecha de Caducidad"
                                        value={formData.expiryDate}
                                        onChange={(val) => setFormData(p => ({ ...p, expiryDate: val }))}
                                        popoverDirection="up"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Existencia {isEdit && "Actual"}</label>
                                <input
                                    type="number"
                                    required
                                    name="quantity"
                                    placeholder="0"
                                    disabled={isEdit}
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
                                    placeholder="0"
                                    value={formData.min_stock}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-secondary rounded-lg border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                    </form>
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800/30">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="item-form"
                        className="px-6 py-2.5 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-cyan-600/40"
                    >
                        {isEdit ? "Guardar Cambios" : "Crear Artículo"}
                    </button>
                </div>
            </div>
        </div>
    );
}
