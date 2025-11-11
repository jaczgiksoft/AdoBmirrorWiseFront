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
import { API_BASE } from "@/utils/apiBase";

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
    const { addToast } = useToastStore();
    const limit = 8;

    // 🔹 Debounce de búsqueda
    useEffect(() => {
        const delay = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    // 🔹 Cargar pacientes paginados
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
                console.error("❌ Error al cargar pacientes:", err);
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

    // 🎹 Atajos de teclado
    useHotkeys(
        {
            escape: () => {
                if (confirmOpen || showForm) return "prevent";
                navigate("/dashboard");
            },
            arrowdown: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % patients.length);
            },
            arrowup: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + patients.length) % patients.length);
            },
            arrowleft: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                if (page > 1) setPage((p) => p - 1);
            },
            arrowright: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                if (page < pagination.totalPages) setPage((p) => p + 1);
            },
            enter: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                const patient = patients[selectedIndex];
                if (patient) navigate(`/patients/${patient.id}`);
            },
            f12: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                setShowForm(true);
            },
            delete: (e) => {
                e.preventDefault();
                const patient = patients[selectedIndex];
                if (patient) handleDeleteClick(patient);
            },
            f1: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();

                if (e.ctrlKey) {
                    const btn = document.querySelector(".filter-toggle-btn");
                    btn?.click();
                } else {
                    searchRef.current?.focus();
                    searchRef.current?.select();
                }

                return "prevent";
            },
        },
        [patients, selectedIndex, confirmOpen, showForm]
    );

    useEffect(() => {
        document.title = "Pacientes | BWISE Dental";
    }, []);

    // 🗑 Confirmar eliminación
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
            addToast({
                type: "success",
                title: "Paciente eliminado",
                message: `${patientToDelete.first_name} ${patientToDelete.last_name} fue eliminado correctamente.`,
            });
        } catch (err) {
            console.error("❌ Error al eliminar paciente:", err);
            addToast({
                type: "error",
                title: "Error al eliminar paciente",
                message:
                    err.response?.data?.message ||
                    "No se pudo eliminar el paciente. Verifica tu conexión o permisos.",
            });
        }
    };

    const handlePatientCreated = () => {
        setShowForm(false);
        setPage(1);
    };

    // 🌀 Estados de carga y error
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <p>Cargando pacientes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-red-400">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-dark flex flex-col font-sans text-slate-50">
            {/* 🔙 Volver + Buscar + Agregar — encabezado principal */}
            <div className="w-full max-w-[110rem] mx-auto px-10 mt-6 flex items-center gap-4 flex-wrap">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="relative group flex items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer"
                >
                    <Home size={18} className="relative top-[1px]" />
                    <ChevronLeft size={16} className="relative top-[1px]" />
                    <span className="absolute left-full ml-3 whitespace-nowrap px-3 py-1.5 text-xs bg-black/85 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
                    Ir al panel principal
                </span>
                </button>

                <h1 className="text-2xl font-semibold text-primary leading-none flex-1">
                    Gestión de pacientes
                </h1>

                {/* 🔍 Buscar + Filtros */}
                <div className="relative flex items-center bg-secondary rounded-lg border border-slate-700">
                    <Search size={16} className="absolute left-2 text-slate-400" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Buscar paciente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-7 pr-16 py-1 bg-transparent text-slate-200 text-sm outline-none placeholder:text-slate-500"
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

                {/* ➕ Nuevo paciente */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition"
                >
                    <PlusCircle size={18} />
                    <span className="font-semibold">F12</span>
                    <span>Agregar paciente</span>
                </motion.button>
            </div>
            {/* 🔹 Contenedor de las dos columnas */}
            <div className="w-full max-w-[110rem] mx-auto px-10 mt-6 flex flex-col md:flex-row gap-6">
                {/* 📊 Dashboard lateral */}
                <div className="w-full md:w-1/4 self-start">
                    <div className="sticky top-6">
                        <PatientDashboard patients={patients} />
                        <PatientAgeChart patients={patients} />
                    </div>
                </div>

                {/* 📋 LISTADO PRINCIPAL */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full md:w-3/4"
                >
                    {/* 📋 Listado de tarjetas */}
                    {patients.length === 0 ? (
                        <p className="text-center text-slate-400">No se encontraron pacientes.</p>
                    ) : (
                        <motion.div
                            key={page}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 place-items-stretch"
                        >
                            {patients.map((p, index) => {
                                const isSelected = index === selectedIndex;
                                const profileSrc = p.photo_url || null;

                                return (
                                    <motion.div
                                        key={p.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => navigate(`/patients/${p.id}`)}
                                        className={`relative bg-secondary rounded-2xl p-6 shadow-md cursor-pointer border transition-all flex flex-col items-center justify-between aspect-square ${
                                            isSelected
                                                ? "border-primary ring-2 ring-primary/40 shadow-hard"
                                                : "border-slate-700 hover:border-primary/60"
                                        }`}
                                    >
                                        {/* 📸 Imagen */}
                                        <div className="flex flex-col items-center mb-3">
                                            {profileSrc ? (
                                                <img
                                                    src={profileSrc}
                                                    alt={p.first_name}
                                                    className="w-20 h-20 rounded-xl object-cover border border-slate-700 bg-slate-800"
                                                    onError={(e) => (e.target.style.display = "none")}
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center">
                                                    <UserIcon size={40} className="text-slate-500" />
                                                </div>
                                            )}
                                        </div>

                                        {/* 👤 Datos principales */}
                                        <div className="text-center mb-4">
                                            <p
                                                className="text-base font-semibold text-primary truncate max-w-[160px] mx-auto"
                                                title={`${p.first_name} ${p.last_name}`}
                                            >
                                                {p.first_name} {p.last_name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                MRN: {p.medical_record_number}
                                            </p>
                                        </div>

                                        {/* 🕓 Tiempo de tratamiento */}
                                        <div className="flex flex-col items-center text-center mb-4">
                                            <p className="text-xs font-medium text-slate-300">
                                                Tiempo de tratamiento
                                            </p>
                                            <div className="w-24 h-[2px] bg-slate-700 rounded mt-1" />
                                        </div>

                                        {/* 🏷️ Etiquetas */}
                                        <div className="grid grid-cols-2 gap-2 w-full">
                                            <div className="bg-dark/40 rounded-lg p-2 border border-slate-700 text-center">
                                                <p className="text-xs font-medium text-slate-200">
                                                    {p.phone_number || "Sin teléfono"}
                                                </p>
                                                <p className="text-[10px] text-slate-500">Teléfono</p>
                                            </div>
                                            <div className="bg-dark/40 rounded-lg p-2 border border-slate-700 text-center">
                                                <p
                                                    className={`text-xs font-semibold ${
                                                        p.genre === "female"
                                                            ? "text-pink-400"
                                                            : p.genre === "male"
                                                                ? "text-sky-400"
                                                                : "text-slate-400"
                                                    }`}
                                                >
                                                    {p.genre === "female"
                                                        ? "Femenino"
                                                        : p.genre === "male"
                                                            ? "Masculino"
                                                            : "Otro"}
                                                </p>
                                                <p className="text-[10px] text-slate-500">Género</p>
                                            </div>
                                            <div className="bg-dark/40 rounded-lg p-2 border border-slate-700 text-center">
                                                <p className="text-xs font-medium text-slate-200">
                                                    {p.status?.name || "Prospecto"}
                                                </p>
                                                <p className="text-[10px] text-slate-500">Estado</p>
                                            </div>
                                            <div className="bg-dark/40 rounded-lg p-2 border border-slate-700 text-center">
                                                <p
                                                    className="text-xs font-medium truncate max-w-[90px] mx-auto"
                                                    style={{ color: p.type?.color || "#9ca3af" }}
                                                    title={p.type?.name || "Sin asignar"}
                                                >
                                                    {p.type?.name || "Sin asignar"}
                                                </p>
                                                <p className="text-[10px] text-slate-500">Tipo</p>
                                            </div>
                                        </div>

                                        {/* 🔧 Acciones */}
                                        <div className="absolute top-3 right-3 flex gap-2 text-slate-400">
                                            <Edit2 size={16} className="hover:text-primary cursor-pointer" />
                                            <Trash2
                                                size={16}
                                                className="hover:text-error cursor-pointer"
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

                    {/* 📄 Paginación */}
                    <Pagination
                        page={page}
                        totalPages={pagination.totalPages}
                        onPageChange={(newPage) => setPage(newPage)}
                    />

                    <p className="text-center text-xs text-slate-500 mt-6">
                        Usa ↑ ↓ para navegar · Enter para editar · F12 para nuevo · Supr para eliminar
                    </p>
                </motion.div>
            </div>



            {/* 🧱 Confirmación de eliminación */}
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

            {/* 🧾 Formulario de creación */}
            <PatientForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onCreated={handlePatientCreated}
            />
        </div>
    );
}
