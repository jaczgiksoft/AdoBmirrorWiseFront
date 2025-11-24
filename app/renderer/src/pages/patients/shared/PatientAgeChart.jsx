import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

export default function PatientAgeChart({ patients = [] }) {
    // Calcular edad
    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const diff = Date.now() - new Date(birthDate).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    const { infantes, adultos } = useMemo(() => {
        let infantes = 0;
        let adultos = 0;

        patients.forEach((p) => {
            const edad = calculateAge(p.birth_date);
            if (edad !== null) {
                if (edad < 18) infantes++;
                else adultos++;
            }
        });

        return { infantes, adultos };
    }, [patients]);

    const total = infantes + adultos;
    const pctInfantes = total ? Math.round((infantes / total) * 100) : 0;

    const data = [
        { name: "Infantes", value: infantes, color: "#06B6D4" }, // cyan-500/600
        { name: "Adultos", value: adultos, color: "#4ADE80" },   // green-400
    ];

    // Encontrar el segmento con mayor valor
    const winner = data.reduce((max, item) =>
            item.value > max.value ? item : max
        , data[0]);


    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="
                rounded-xl p-3
                bg-white  border-slate-300
                dark:bg-secondary dark:border-slate-700
                flex flex-col gap-4
            "
        >
            {/* Título compacto */}
            <h2 className="text-sm font-semibold text-cyan-600 dark:text-primary text-center">
                Distribución por edad
            </h2>

            {/* Gráfico compacto */}
            <div className="relative h-40 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Texto central dinámico basado en el ganador */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="absolute text-center"
                >
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {winner.name}
                    </p>
                    <p
                        className="text-lg font-bold"
                        style={{ color: winner.color }}
                    >
                        {total ? Math.round((winner.value / total) * 100) : 0}%
                    </p>
                </motion.div>
            </div>

            {/* Leyenda mini */}
            <div className="grid grid-cols-2 gap-2">
                {data.map((item) => (
                    <LegendItem
                        key={item.name}
                        label={item.name}
                        value={item.value}
                        color={item.color}
                    />
                ))}
            </div>
        </motion.div>
    );
}

/* ------------------------ LEYENDA MINI ------------------------ */
function LegendItem({ label, value, color }) {
    return (
        <div
            className="
                flex items-center justify-between px-2 py-1.5 rounded-lg
                bg-slate-100 border border-slate-300
                dark:bg-dark/40 dark:border-slate-700
                transition
            "
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                    {label}
                </span>
            </div>

            <span
                className="text-xs font-semibold"
                style={{ color }}
            >
                {value}
            </span>
        </div>
    );
}
