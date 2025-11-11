import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

export default function PatientAgeChart({ patients = [] }) {
    // Definimos que un paciente es infante si tiene menos de 18 años
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
    const data = [
        { name: "Infantes", value: infantes, color: "#60A5FA" },
        { name: "Adultos", value: adultos, color: "#F472B6" },
    ];

    const pctInfantes = total ? Math.round((infantes / total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-secondary rounded-2xl p-2 border border-slate-700 flex flex-col gap-5 shadow-inner"
        >
            <h2 className="text-lg font-semibold text-primary text-center tracking-wide">
                Distribución por edad
            </h2>

            <div className="relative h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* 💬 Texto central */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="absolute text-center"
                >
                    <p className="text-slate-400 text-xs">Infantes</p>
                    <p className="text-xl font-bold text-primary">{pctInfantes}%</p>
                </motion.div>
            </div>

            {/* Leyenda */}
            <div className="grid grid-cols-2 gap-3 mt-2">
                {data.map((item) => (
                    <LegendItem key={item.name} label={item.name} value={item.value} color={item.color} />
                ))}
            </div>
        </motion.div>
    );
}

function LegendItem({ label, value, color }) {
    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-700 bg-dark/40 hover:bg-dark/60 transition">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm text-slate-300">{label}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color }}>{value}</span>
        </div>
    );
}
