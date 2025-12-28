import React, { useState, useEffect } from 'react';
import Datepicker from "react-tailwindcss-datepicker";

const AdditionalDataStep = ({ data, onChange }) => {
    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const [dateValue, setDateValue] = useState({
        startDate: null,
        endDate: null
    });

    useEffect(() => {
        if (data.date) {
            setDateValue({
                startDate: data.date,
                endDate: data.date
            });
        }
    }, [data.date]);

    const handleDateChange = (newValue) => {
        setDateValue(newValue);

        // Ensure we store a string, handling Date objects if returned
        let dateString = "";
        if (newValue?.startDate) {
            const val = newValue.startDate;
            if (val instanceof Date || typeof val === 'object') {
                // Formatting to YYYY-MM-DD
                const d = new Date(val);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dateString = `${year}-${month}-${day}`;
            } else {
                dateString = val;
            }
        }

        handleChange('date', dateString);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Section 1: Order Information */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                    Información de la Orden
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 label-required">
                            Destinatario
                        </label>
                        <select
                            value={data.destination || ''}
                            onChange={(e) => handleChange('destination', e.target.value)}
                            className="
                                w-full px-3 py-2.5 rounded-lg border 
                                bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                                border-slate-300 dark:border-slate-700
                                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                                transition-all appearance-none
                            "
                        >
                            <option value="">Seleccionar destinatario...</option>
                            <option value="dr_perez">Dr. Juan Pérez (Cirugía Maxilofacial)</option>
                            <option value="clinica_central">Clínica Dental Central</option>
                            <option value="other">Otro Externo</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 label-required">
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
                            inputClassName="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Clinical Observations */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                    Observaciones Clínicas
                </h3>
                <textarea
                    rows={5}
                    value={data.observations || ''}
                    onChange={(e) => handleChange('observations', e.target.value)}
                    placeholder="Especifique complicaciones previstas, antecedentes médicos relevantes o instrucciones especiales..."
                    className="
                        w-full px-4 py-3 rounded-lg border resize-none
                        bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                        border-slate-300 dark:border-slate-700
                        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                        transition-all placeholder:text-slate-400
                    "
                />
            </div>

            {/* Section 3: Additional Procedures */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                    Procedimientos Adicionales
                </h3>
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={data.prophylaxis || false}
                                onChange={(e) => handleChange('prophylaxis', e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all checked:border-primary checked:bg-primary hover:border-primary"
                            />
                            <svg
                                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="14"
                                height="14"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            Profilaxis Previa
                        </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={data.fluoride || false}
                                onChange={(e) => handleChange('fluoride', e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all checked:border-primary checked:bg-primary hover:border-primary"
                            />
                            <svg
                                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="14"
                                height="14"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            Aplicación de Flúor
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default AdditionalDataStep;
