import * as Icons from "lucide-react";

export const STATUS_CONFIG = {
    pendiente: {
        color: 'text-amber-600',
        bg: 'bg-amber-100',
        border: 'border-amber-200',
        stripe: '#F59E0B',
        icon: 'Clock',
        label: 'Pendiente'
    },
    confirmada: {
        color: 'text-emerald-600',
        bg: 'bg-emerald-100',
        border: 'border-emerald-200',
        stripe: '#10B981',
        icon: 'CheckCircle',
        label: 'Confirmada'
    },
    en_espera: {
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        border: 'border-orange-200',
        stripe: '#F97316',
        icon: 'User',
        label: 'En Sala de Espera'
    },
    en_tratamiento: {
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        border: 'border-blue-200',
        stripe: '#3B82F6',
        icon: 'Activity',
        label: 'En Tratamiento'
    },
    finalizada: {
        color: 'text-slate-600',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        stripe: '#64748B',
        icon: 'CheckCircle',
        label: 'Finalizada'
    },
    cancelada: {
        color: 'text-red-600',
        bg: 'bg-red-100',
        border: 'border-red-200',
        stripe: '#EF4444',
        icon: 'AlertCircle',
        label: 'Cancelada'
    }
};

export function getStatusConfig(status) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pendiente;

    return {
        ...config,
        icon: Icons[config.icon] || Icons.Clock
    };
}