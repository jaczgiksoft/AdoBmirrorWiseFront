import { useState, useEffect } from "react";
import Datepicker from "react-tailwindcss-datepicker";

export default function DateInput({ label, value, onChange, popoverDirection = "down" }) {
    const [dateValue, setDateValue] = useState({
        startDate: value || null,
        endDate: value || null
    });

    useEffect(() => {
        setDateValue({
            startDate: value || null,
            endDate: value || null
        });
    }, [value]);

    const handleDateChange = (newValue) => {
        setDateValue(newValue);

        let dateString = "";
        if (newValue?.startDate) {
            const val = newValue.startDate;
            if (val instanceof Date) {
                const d = new Date(val);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dateString = `${year}-${month}-${day}`;
            } else {
                dateString = val;
            }
        }

        onChange(dateString);
    };

    return (
        <div className="space-y-1">
            {label && (
                <label className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1">
                    {label}
                </label>
            )}
            <Datepicker
                value={dateValue}
                onChange={handleDateChange}
                useRange={false}
                asSingle={true}
                displayFormat={"YYYY-MM-DD"}
                placeholder="Seleccionar fecha..."
                readOnly={true}
                i18n={"es"}
                containerClassName="relative z-[9999]"
                popoverDirection={popoverDirection}
                inputClassName="w-full px-3 py-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
            />
        </div>
    );
}
