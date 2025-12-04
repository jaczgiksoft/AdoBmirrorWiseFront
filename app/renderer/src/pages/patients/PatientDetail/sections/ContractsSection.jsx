import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    FileText,
    Calendar,
    UserCheck,
    ExternalLink,
    ShieldCheck,
    Search
} from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';

export default function ContractsSection({ patientId }) {
    const { profile } = useOutletContext();
    // Use prop if available, otherwise fallback to profile.id
    const activeId = patientId || profile?.id;

    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [filterText, setFilterText] = useState('');
    const inputRef = useRef(null);

    // F1 Shortcut
    useHotkeys(
        {
            f1: (e) => {
                e.preventDefault();
                inputRef.current?.focus();
            }
        },
        [],
        true
    );

    const filteredContracts = contracts.filter(c =>
        c.title.toLowerCase().includes(filterText.toLowerCase())
    );

    useEffect(() => {
        // ---------------------------------------------------------
        // MOCK DATA LOADING
        // Replace this with: fetch(\`/contracts/patient/\${activeId}\`)
        // ---------------------------------------------------------
        const loadContracts = async () => {
            setLoading(true);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 600));

            // Realistic Mock Data
            const mockData = [
                {
                    id: 'ctr_001',
                    title: 'Acuerdo Financiero y Plan de Pagos',
                    signed_at: '2025-10-15T09:30:00Z',
                    signed_by: profile ? `${profile.first_name} ${profile.last_name}` : 'Paciente Ejemplo',
                    file_url: '#',
                    requires_signature: false
                },
                {
                    id: 'ctr_002',
                    title: 'Consentimiento Informado - Ortodoncia',
                    signed_at: '2025-10-15T09:45:00Z',
                    signed_by: profile ? `${profile.first_name} ${profile.last_name}` : 'Paciente Ejemplo',
                    file_url: '#',
                    requires_signature: false
                },
                {
                    id: 'ctr_003',
                    title: 'Aviso de Privacidad (HIPAA)',
                    signed_at: '2025-10-15T09:50:00Z',
                    signed_by: profile ? `${profile.first_name} ${profile.last_name}` : 'Paciente Ejemplo',
                    file_url: '#',
                    requires_signature: false
                },
                {
                    id: 'ctr_004',
                    title: 'Autorización de Uso de Imágenes (Rayos X)',
                    signed_at: '2025-10-20T14:20:00Z',
                    signed_by: profile ? `${profile.first_name} ${profile.last_name}` : 'Paciente Ejemplo',
                    file_url: '#',
                    requires_signature: false
                },
                {
                    id: 'ctr_005',
                    title: 'Política de Cancelación y Citas',
                    signed_at: '2025-10-20T14:25:00Z',
                    signed_by: profile ? `${profile.first_name} ${profile.last_name}` : 'Paciente Ejemplo',
                    file_url: '#',
                    requires_signature: false
                }
            ];

            setContracts(mockData);
            setLoading(false);
        };

        if (activeId) {
            loadContracts();
        }
    }, [activeId, profile]);

    return (
        <div className="space-y-6 text-slate-800 dark:text-slate-100">
            <Section
                title="Contratos Firmados"
                icon={ShieldCheck}
                subtitle="Documentación legal y consentimientos firmados por el paciente."
            >
                {/* Filter Input */}
                <div className="relative flex items-center bg-white border border-slate-300 dark:bg-secondary dark:border-slate-700 rounded-lg w-full max-w-sm mb-4">
                    <Search size={16} className="absolute left-2 text-slate-500 dark:text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Filtrar por título..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="
                            pl-7 pr-4 py-1.5 bg-transparent
                            text-slate-700 dark:text-slate-200
                            text-sm outline-none
                            placeholder:text-slate-500 dark:placeholder:text-slate-500
                            w-full
                        "
                    />
                </div>

                {loading ? (
                    <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                        Cargando contratos...
                    </div>
                ) : filteredContracts.length === 0 ? (
                    <EmptyState text={filterText ? "No matching contracts found." : "No hay contratos firmados."} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredContracts.map(contract => (
                            <ContractCard key={contract.id} contract={contract} />
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
}

/* ============================================================
    INTERNAL COMPONENTS
============================================================ */

function Section({ title, icon: Icon, subtitle, children }) {
    return (
        <div
            className="
                bg-white dark:bg-secondary
                border border-slate-200 dark:border-slate-700
                rounded-2xl p-5 shadow-sm
                space-y-4
            "
        >
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <Icon size={20} className="opacity-80" />
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-2">
                {children}
            </div>
        </div>
    );
}

function ContractCard({ contract }) {
    return (
        <div
            className="
                group relative
                bg-white dark:bg-secondary
                border border-slate-200 dark:border-slate-700
                rounded-xl p-4 shadow-sm
                hover:shadow-md hover:border-primary/30 transition-all duration-200
                flex flex-col gap-3
            "
        >
            {/* Header: Icon + Title */}
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-2" title={contract.title}>
                        {contract.title}
                    </h3>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 pt-1">
                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar size={12} />
                    <span>
                        {new Date(contract.signed_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </span>
                </div>

                {/* Signed By */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <UserCheck size={12} />
                    <span className="truncate max-w-full">
                        {contract.signed_by}
                    </span>
                </div>
            </div>

            {/* Action Button (View) */}
            <div className="pt-2 mt-auto">
                <a
                    href={contract.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                        flex items-center justify-center gap-2 w-full
                        py-2 px-3 rounded-lg
                        text-xs font-medium
                        bg-slate-50 dark:bg-slate-800 
                        text-slate-600 dark:text-slate-300
                        hover:bg-primary hover:text-white
                        transition-colors
                    "
                    onClick={(e) => {
                        e.preventDefault();
                        // Handle view logic here (e.g., open modal)
                        alert(`Abrir documento: ${contract.title}`);
                    }}
                >
                    <ExternalLink size={14} />
                    Ver Documento
                </a>
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-center mb-2">
                <FileText size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                {text}
            </p>
        </div>
    );
}
