import React, { useState, useEffect } from 'react';
import Datepicker from "react-tailwindcss-datepicker";
import { Plus, X } from 'lucide-react';

/* ============================================================
   🔹 HELPERS
============================================================ */

const formatDate = (value) => {
    if (!value) return "";

    try {
        const d = new Date(value);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return "";
    }
};

/* ============================================================
   🔹 COMPONENT
============================================================ */

const AdditionalDataStep = ({ data, onChange, clinicalMode }) => {

    /* ============================
       🔹 STATE
    ============================ */

    const [dateValue, setDateValue] = useState({
        startDate: null,
        endDate: null
    });

    const [showModal, setShowModal] = useState(false);
    const [newSpecialist, setNewSpecialist] = useState("");

    const [specialists, setSpecialists] = useState([
        { id: 'dr_perez', name: 'Dr. Juan Pérez (Cirugía Maxilofacial)' },
        { id: 'clinica_central', name: 'Clínica Dental Central' }
    ]);

    /* ============================
       🔹 SYNC
    ============================ */

    useEffect(() => {
        if (data?.date) {
            setDateValue({
                startDate: data.date,
                endDate: data.date
            });
        }
    }, [data?.date]);

    /* ============================
       🔹 HANDLERS
    ============================ */

    const handleChange = (field, value) => {
        onChange({
            ...data,
            [field]: value
        });
    };

    const handleDateChange = (newValue) => {
        setDateValue(newValue);
        handleChange('date', formatDate(newValue?.startDate));
    };

    const handleAddSpecialist = () => {
        if (!newSpecialist.trim()) return;

        const id = `custom_${Date.now()}`;
        const newItem = { id, name: newSpecialist };

        setSpecialists(prev => [...prev, newItem]);

        // 🔥 auto seleccionar
        handleChange('destination', id);

        setNewSpecialist("");
        setShowModal(false);
    };

    /* ============================
       🔹 UI
    ============================ */

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* ================= SECTION 1 ================= */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                    Información de la Orden
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* DESTINATION */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Referido a
                        </label>

                        <div className="flex gap-2">
                            <select
                                value={data.destination || ''}
                                onChange={(e) => handleChange('destination', e.target.value)}
                                className="
                                    flex-1 px-3 py-2.5 rounded-lg border 
                                    bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                                    border-slate-300 dark:border-slate-700
                                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                                    transition-all
                                "
                            >
                                <option value="">Seleccionar especialista...</option>

                                {specialists.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>

                            {/* BOTÓN + */}
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="
                                    px-3 rounded-lg border 
                                    border-slate-300 dark:border-slate-700
                                    bg-white dark:bg-slate-800
                                    text-slate-500 hover:text-primary
                                    hover:border-primary
                                    transition-all flex items-center justify-center
                                "
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* DATE */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Fecha Sugerida
                        </label>

                        <Datepicker
                            value={dateValue}
                            onChange={handleDateChange}
                            useRange={false}
                            asSingle={true}
                            displayFormat={"YYYY-MM-DD"}
                            placeholder="Seleccionar fecha..."
                            readOnly={true}
                            i18n={"es"}
                            inputClassName="
                                w-full px-3 py-2.5 rounded-lg border 
                                bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                                border-slate-300 dark:border-slate-700
                                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                                transition-all
                            "
                        />
                    </div>

                </div>
            </div>

            {/* ================= SECTION 2 ================= */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                    Observaciones Clínicas
                </h3>

                <textarea
                    rows={5}
                    value={data.observations || ''}
                    onChange={(e) => handleChange('observations', e.target.value)}
                    placeholder="Complicaciones previstas, antecedentes médicos o instrucciones especiales..."
                    className="
                        w-full px-4 py-3 rounded-lg border resize-none
                        bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                        border-slate-300 dark:border-slate-700
                        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                        transition-all placeholder:text-slate-400
                    "
                />
            </div>

            {/* ================= SECTION 3 ================= */}
            {clinicalMode === 'restorative' && (
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                        Procedimientos Adicionales
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                        <Checkbox
                            label="Profilaxis Previa"
                            checked={data.prophylaxis || false}
                            onChange={(val) => handleChange('prophylaxis', val)}
                        />
                        <Checkbox
                            label="Aplicación de Flúor"
                            checked={data.fluoride || false}
                            onChange={(val) => handleChange('fluoride', val)}
                        />
                    </div>
                </div>
            )}

            {/* ================= MODAL ================= */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="
            bg-white dark:bg-slate-800 
            rounded-xl shadow-xl 
            w-full max-w-md p-6
            border border-slate-200 dark:border-slate-700
        ">

                        {/* HEADER */}
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                Nuevo Especialista
                            </h4>

                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* INPUT */}
                        <input
                            type="text"
                            value={newSpecialist}
                            onChange={(e) => setNewSpecialist(e.target.value)}
                            placeholder="Nombre del especialista..."
                            className="
                    w-full px-3 py-2.5 rounded-lg border mb-5
                    bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                    border-slate-300 dark:border-slate-700
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    transition-all
                "
                        />

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3">

                            {/* CANCEL */}
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setNewSpecialist("");
                                }}
                                className="
                        px-4 py-2 rounded-lg font-medium
                        text-slate-500 hover:text-slate-700
                        dark:text-slate-400 dark:hover:text-slate-200
                        hover:bg-slate-100 dark:hover:bg-slate-700
                        transition-all
                    "
                            >
                                Cancelar
                            </button>

                            {/* SAVE */}
                            <button
                                onClick={handleAddSpecialist}
                                className="
                        px-4 py-2 rounded-lg font-medium
                        bg-primary text-white
                        hover:bg-primary/90
                        transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                                disabled={!newSpecialist.trim()}
                            >
                                Guardar
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

/* ============================================================
   🔹 CHECKBOX
============================================================ */

function Checkbox({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all checked:border-primary checked:bg-primary"
                />
                <svg
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                    width="14"
                    height="14"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>

            <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {label}
            </span>
        </label>
    );
}

export default AdditionalDataStep;