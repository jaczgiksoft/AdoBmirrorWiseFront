import { useMemo } from 'react';
import {
    Users,
    UserPlus,
    Calendar,
    CalendarX,
    Clock,
    Stethoscope,
    TrendingUp,
    AlertTriangle,
    Package,
    ClipboardList,
    TrendingDown,
    Zap
} from 'lucide-react';

export const useFiltroData = () => {
    const clinicaStats = useMemo(() => ({
        kpis: [
            { label: "Cantidad de empleados total", value: "24", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Pacientes totales", value: "1,248", icon: UserPlus, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Citas de hoy", value: "18", icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Citas canceladas", value: "3", icon: CalendarX, color: "text-red-500", bg: "bg-red-500/10" },
        ],
        rendimiento: {
            duracionPromedio: "42 min",
            ortodoncia: {
                label: "Ortodoncia general",
                duracion: "50 min",
                espera: "20 min",
                totalPacientes: 72
            },
            solicitados: [
                { name: "Resina Estética", count: 42, color: "bg-blue-500" },
                { name: "Limpieza Ultrasónica", count: 35, color: "bg-emerald-500" },
                { name: "Extracción Simple", count: 28, color: "bg-amber-500" },
                { name: "Endodoncia Incisivo", count: 15, color: "bg-rose-500" }
            ],
            espera: {
                promedio: "18 min",
                critico: "12", // +30 min
                diaCritico: "Lunes",
                sinEspera: 31
            }
        }
    }), []);

    const inventarioStats = useMemo(() => ({
        stock: {
            alerta: 18,
            criticos: 5,
            total: 124,
            reponer: 9
        },
        movimientos: {
            caducado: 4,
            devolucion: 2,
            entrada: 57,
            merma: 8,
            salida: 49
        },
        masUtilizados: {
            top: "3 materiales ortodónticos top",
            repuestos: "2 veces en 7 días",
            usos: 76,
            provedor: "Caries"
        }
    }), []);

    return {
        clinicaStats,
        inventarioStats
    };
};
