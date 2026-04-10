import {
    Stethoscope,
    AlertTriangle,
    UserCog,
    Bell,
    Settings,
    Briefcase,
    Layout,
    Package,
    Users,
    Calendar,
    FileText,
    CreditCard,
    Clock,
    TrendingUp
} from "lucide-react";

export const MODULE_CONFIG = {
    appointments: {
        order: 1,
        label: "Citas",
        icon: Calendar,
        color: "#6366f1", // Indigo
        path: "/appointments",
        key: "F12",
    },
    attendance: {
        order: 4,
        label: "Asistencias",
        icon: Clock,
        color: "#f43f5e", // Rose
        path: "/attendance",
        key: "F9",
    },
    patients: {
        order: 2,
        label: "Pacientes",
        icon: Stethoscope,
        color: "#0ea5e9",
        path: "/patients",
        key: "F1",
    },
    inventory: {
        order: 3,
        label: "Inventario",
        icon: Package,
        color: "#a855f7",
        path: "/inventory",
        key: "F3",
    },
    employees: {
        order: 4,
        label: "Empleados",
        icon: Users,
        color: "#10b981",
        path: "/employees",
        key: "F7",
    },
    patient_alerts: {
        order: 5,
        label: "Alertas de Paciente",
        icon: AlertTriangle,
        color: "#f59e0b",
        path: "/patient-alerts",
        key: "F8",
    },
    settings: {
        order: 9,
        label: "Configuración",
        icon: Settings,
        color: "#10b981",
        path: "/settings",
        key: "F11",
    },
    notifications: {
        order: 6,
        label: "Notificaciones",
        icon: Bell,
        color: "#ef4444",
        path: "/notifications",
        key: "F10",
    },
    reports: {
        order: 11,
        label: "Reportes",
        icon: FileText,
        color: "#6b7280",
        path: "/reports",
        key: null,
    },
    payments: {
        order: 12,
        label: "Pagos",
        icon: CreditCard,
        color: "#f59e0b", // Amber
        path: "/payments",
        key: null,
    },
    filtro: {
        order: 13,
        label: "Filtro",
        icon: TrendingUp,
        color: "#3b82f6", // Blue
        path: "/filtro",
        key: "F2",
    },
};
