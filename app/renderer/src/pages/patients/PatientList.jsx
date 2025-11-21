import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { getPatientsPaginated, deletePatient } from "@/services/patient.service";
import PatientForm from "./PatientForm";
import FilterDropdown from "./PatientFilterDropdown";
import PatientDashboard from "./components/PatientDashboard";
import PatientAgeChart from "./components/PatientAgeChart";
import PatientTypeSelectorModal from "./components/PatientTypeSelectorModal";

import {
    PlusCircle,
    ChevronLeft,
    User as UserIcon,
    Edit2,
    Trash2,
    Search,
    Home,
} from "lucide-react";

import { Pagination } from "@/components/ui";
import { getContrastColor } from "@/utils/helpers";

export default function PatientList() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [patientToDelete, setPatientToDelete] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [filters, setFilters] = useState({});

    const searchRef = useRef(null);

    // Nuevo modal
    const [selectTypeOpen, setSelectTypeOpen] = useState(false);
    const [newPatientType, setNewPatientType] = useState(null);

    const { addToast } = useToastStore();
    const limit = 8;

    // Debounce search
    useEffect(() => {
        const delay = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    // Load patients
    useEffect(() => {
        async function loadPatients() {
            try {
                if (patients.length === 0 && page === 1 && !debouncedSearch) {
                    setLoading(true);
                }

                const start = (page - 1) * limit;
                const res = await getPatientsPaginated({
                    start,
                    length: limit,
                    searchValue: debouncedSearch,
                    orderColumn: "last_name",
                    orderDir: "ASC",
                    ...filters,
                });

                setPatients(res.data || res.rows || []);
                setPagination({
                    total: res.recordsFiltered || 0,
                    totalPages: Math.ceil((res.recordsFiltered || 0) / limit) || 1,
                });
                setSelectedIndex(0);
            } catch (err) {
                setError("No se pudieron cargar los pacientes.");
                addToast({
                    type: "error",
                    title: "Error al cargar pacientes",
                    message: "No se pudieron obtener los datos desde el servidor.",
                });
            } finally {
                setLoading(false);
            }
        }

        loadPatients();
    }, [page, debouncedSearch, filters]);

    // Hotkeys LISTADO
    useHotkeys(
        {
            arrowdown: (e) => {
                if (selectTypeOpen || showForm || confirmOpen) return;
                e.preventDefault();

                setSelectedIndex((prev) => {
                    const next = prev + 1;
                    return next < patients.length ? next : prev;
                });
                return "prevent";
            },

            arrowup: (e) => {
                if (selectTypeOpen || showForm || confirmOpen) return;
                e.preventDefault();

                setSelectedIndex((prev) => {
                    const next = prev - 1;
                    return next >= 0 ? next : 0;
                });
                return "prevent";
            },

            enter: (e) => {
                if (selectTypeOpen || showForm || confirmOpen) return;
                e.preventDefault();
                const patient = patients[selectedIndex];
                if (patient) navigate(`/patients/${patient.id}`);
                return "prevent";
            },

            escape: (e) => {
                if (selectTypeOpen || showForm || confirmOpen) return;
                e.preventDefault();
                setSelectedIndex(0);
                return "prevent";
            },

            delete: (e) => {
                if (selectTypeOpen || showForm || confirmOpen) return;
                e.preventDefault();

                const p = patients[selectedIndex];
                if (p) handleDeleteClick(p);

                return "prevent";
            },

            arrowleft: (e) => {
                if (selectTypeOpen || showForm || confirmOpen) return;
                if (page > 1) {
                    e.preventDefault();
                    setPage((p) => p - 1);
                }
            },

            arrowright: (e) => {
                if (selectTypeOpen || showForm || confirmOpen) return;
                if (page < pagination.totalPages) {
                    e.preventDefault();
                    setPage((p) => p + 1);
                }
            },

            f12: (e) => {
                if (selectTypeOpen || showForm || confirmOpen) return;
                e.preventDefault();
                setSelectTypeOpen(true);
                return "prevent";
            },
        },
        [patients, selectedIndex, showForm, confirmOpen, selectTypeOpen]
    );

    // Delete logic
    const handleDeleteClick = (patient) => {
        setPatientToDelete(patient);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!patientToDelete) return;
        try {
            await deletePatient(patientToDelete.id);
            setPatients((prev) => prev.filter((p) => p.id !== patientToDelete.id));
            setConfirmOpen(false);
            setPatientToDelete(null);
        } catch (err) {
            addToast({
                type: "error",
                title: "Error al eliminar paciente",
                message: err.response?.data?.message || "No se pudo eliminar.",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-500 dark:text-slate-400">
                Cargando pacientes...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-red-500 dark:text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="bg-slate-100 dark:bg-dark flex flex-col font-sans text-slate-900 dark:text-slate-50">

            {/* ---------- HEADER ---------- */}
            <div className="w-full max-w-[110rem] mx-auto px-10 mt-6 flex items-center gap-4 flex-wrap">

                <button
                    onClick={() => navigate("/dashboard")}
                    className="relative group flex items-center gap-1
                        text-slate-600 hover:text-slate-900
                        dark:text-slate-400 dark:hover:text-white
                        transition cursor-pointer"
                >
                    <Home size={18} />
                    <ChevronLeft size={16} />
                    <span className="absolute left-full ml-3 whitespace-nowrap px-3 py-1.5 text-xs
                        bg-white text-slate-700 dark:bg-black/85 dark:text-white
                        rounded-lg shadow-lg opacity-0 group-hover:opacity-100
                        transition-all duration-200">
                        Ir al panel principal
                    </span>
                </button>

                <h1 className="text-2xl font-semibold text-cyan-600 dark:text-primary leading-none flex-1">
                    Gestión de pacientes
                </h1>

                {/* Search */}
                <div className="relative flex items-center
                    bg-white border border-slate-300
                    dark:bg-secondary dark:border-slate-700
                    rounded-lg">

                    <Search size={16} className="absolute left-2 text-slate-500 dark:text-slate-400" />

                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Buscar paciente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="
                            pl-7 pr-16 py-1 bg-transparent
                            text-slate-700 dark:text-slate-200
                            text-sm outline-none
                            placeholder:text-slate-500 dark:placeholder:text-slate-500
                        "
                    />

                    <div className="absolute right-1">
                        <FilterDropdown
                            filters={filters}
                            onApply={(selected) => {
                                setFilters(selected);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* Add new */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectTypeOpen(true)}
                    className="flex items-center gap-2
                        bg-cyan-600 hover:bg-cyan-700 text-white
                        px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                    <PlusCircle size={18} />
                    <span className="font-semibold">F12</span>
                    <span>Agregar paciente</span>
                </motion.button>
            </div>

            {/* ---------- BODY (dashboard + list) ---------- */}
            <div className="w-full max-w-[110rem] mx-auto px-10 mt-6 flex flex-col md:flex-row gap-6">

                {/* Dashboard */}
                <div className="w-full md:w-1/4 self-start">
                    <div className="sticky top-6 space-y-6">

                        <div className="
                            bg-white border border-slate-300 rounded-xl p-4
                            dark:bg-secondary dark:border-slate-700
                            shadow-sm">
                            <PatientDashboard patients={patients} />
                        </div>

                        <div className="
                            bg-white border border-slate-300 rounded-xl p-4
                            dark:bg-secondary dark:border-slate-700
                            shadow-sm">
                            <PatientAgeChart patients={patients} />
                        </div>

                    </div>
                </div>

                {/* LIST */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full md:w-3/4"
                >
                    {patients.length === 0 ? (
                        <p className="text-center text-slate-500 dark:text-slate-400">
                            No se encontraron pacientes.
                        </p>
                    ) : (
                        <motion.div
                            key={page}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="
                                grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2
                                lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4
                                gap-6
                            "
                        >
                            {patients.map((p, index) => {
                                const isSelected = index === selectedIndex;

                                return (
                                    <motion.div
                                        key={p.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => navigate(`/patients/${p.id}`)}
                                        className={`
                                            relative rounded-2xl p-6 cursor-pointer border
                                            flex flex-col items-center justify-between aspect-square
                                            
                                            bg-white border-slate-300 text-slate-800 shadow-sm
                                            dark:bg-secondary dark:border-slate-700 dark:text-slate-50
                                            
                                            ${
                                            isSelected
                                                ? "ring-2 ring-cyan-500 ring-offset-4 ring-offset-slate-100 dark:ring-offset-dark"
                                                : "hover:border-cyan-500"
                                        }
                                        `}
                                    >
                                        {/* Imagen */}
                                        <div className="flex flex-col items-center mb-3">
                                            {p.photo_url ? (
                                                <img
                                                    src={p.photo_url}
                                                    alt={p.first_name}
                                                    className="
                                                        w-20 h-20 rounded-xl object-cover
                                                        border border-slate-300 dark:border-slate-700
                                                        bg-slate-100 dark:bg-slate-800
                                                    "
                                                />
                                            ) : (
                                                <div className="
                                                    w-20 h-20 rounded-xl border
                                                    border-slate-300 dark:border-slate-700
                                                    bg-slate-100 dark:bg-slate-800
                                                    flex items-center justify-center
                                                ">
                                                    <UserIcon size={40} className="text-slate-500" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Datos */}
                                        <div className="text-center mb-4">
                                            <p className="text-base font-semibold text-cyan-600 dark:text-cyan-400 truncate max-w-[160px] mx-auto">
                                                {p.first_name} {p.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                MRN: {p.medical_record_number}
                                            </p>
                                        </div>

                                        {/* Etiquetas */}
                                        <div className="grid grid-cols-2 gap-2 w-full">

                                            <div className="
                                                bg-slate-100 dark:bg-dark/40
                                                border border-slate-300 dark:border-slate-700
                                                rounded-lg p-2 text-center
                                            ">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                                    {p.phone_number || "Sin teléfono"}
                                                </p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-500">Teléfono</p>
                                            </div>

                                            <div className="
                                                bg-slate-100 dark:bg-dark/40
                                                border border-slate-300 dark:border-slate-700
                                                rounded-lg p-2 text-center
                                            ">
                                                <p
                                                    className={`
                                                        text-xs font-semibold
                                                        ${
                                                        p.genre === "female"
                                                            ? "text-pink-500"
                                                            : p.genre === "male"
                                                                ? "text-sky-500"
                                                                : "text-slate-500"
                                                    }
                                                    `}
                                                >
                                                    {p.genre === "female"
                                                        ? "Femenino"
                                                        : p.genre === "male"
                                                            ? "Masculino"
                                                            : "Otro"}
                                                </p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-500">Género</p>
                                            </div>

                                            <div className="
                                                bg-slate-100 dark:bg-dark/40
                                                border border-slate-300 dark:border-slate-700
                                                rounded-lg p-2 text-center
                                            ">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                                    {p.status?.name || "Prospecto"}
                                                </p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-500">Estado</p>
                                            </div>

                                            <div className="
                                                bg-slate-100 dark:bg-dark/40
                                                border border-slate-300 dark:border-slate-700
                                                rounded-lg p-2 text-center
                                            ">
                                                {Array.isArray(p.types) && p.types.length > 0 ? (
                                                    <div className="flex justify-center flex-wrap gap-1">
                                                        {p.types.map((t) => {
                                                            const initials = t.name
                                                                .split(" ")
                                                                .map((w) => w[0])
                                                                .join("")
                                                                .toUpperCase();

                                                            const textColor = getContrastColor(t.color);

                                                            return (
                                                                <span
                                                                    key={t.id}
                                                                    className="w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shadow-sm"
                                                                    style={{
                                                                        backgroundColor: t.color,
                                                                        color: textColor,
                                                                    }}
                                                                >
                                                                    {initials}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500 dark:text-slate-500">Sin tipo</p>
                                                )}
                                                <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">Tipos</p>
                                            </div>

                                        </div>

                                        {/* Acciones */}
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <Edit2
                                                size={16}
                                                className="text-slate-500 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-primary cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/patients/${p.id}`);
                                                }}
                                            />

                                            <Trash2
                                                size={16}
                                                className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-error cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(p);
                                                }}
                                            />
                                        </div>

                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    <Pagination
                        page={page}
                        totalPages={pagination.totalPages}
                        onPageChange={(newPage) => setPage(newPage)}
                    />

                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                        Usa ↑ ↓ para navegar · Enter para abrir · F12 para nuevo · Supr para eliminar
                    </p>
                </motion.div>
            </div>

            {/* Confirmación */}
            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar paciente"
                message={
                    patientToDelete
                        ? `¿Deseas eliminar a "${patientToDelete.first_name} ${patientToDelete.last_name}"?`
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />

            {/* Modal tipo de paciente */}
            <PatientTypeSelectorModal
                open={selectTypeOpen}
                onClose={() => setSelectTypeOpen(false)}
                onSelect={(type) => {
                    setNewPatientType(type);
                    setSelectTypeOpen(false);
                    setShowForm(true);
                }}
            />

            {/* Formulario */}
            <PatientForm
                open={showForm}
                patientType={newPatientType}
                onClose={() => setShowForm(false)}
                onCreated={() => {
                    setShowForm(false);
                    setPage(1);
                }}
            />
        </div>
    );
}
