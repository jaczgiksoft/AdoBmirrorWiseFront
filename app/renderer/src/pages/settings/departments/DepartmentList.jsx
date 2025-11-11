// src/pages/settings/departments/DepartmentList.jsx
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { getDepartmentsPaginated, deleteDepartment } from "@/services/department.service";
import DepartmentForm from "./DepartmentForm";
import {
    PlusCircle,
    ChevronLeft,
    Layers,
    Edit2,
    Trash2,
    Search,
    Home,
    Percent,
} from "lucide-react";
import { Pagination } from "@/components/ui";

export default function DepartmentList() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const searchRef = useRef(null);
    const { addToast } = useToastStore();
    const limit = 10;

    useEffect(() => {
        const delay = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    useEffect(() => {
        async function loadDepartments() {
            try {
                const start = (page - 1) * limit;
                const res = await getDepartmentsPaginated({
                    start,
                    length: limit,
                    searchValue: debouncedSearch,
                    orderColumn: "name",
                    orderDir: "ASC",
                });
                setDepartments(res.rows || res.data || []);
                setPagination({
                    total: res.recordsFiltered || 0,
                    totalPages: Math.ceil((res.recordsFiltered || 0) / limit) || 1,
                });
                setSelectedIndex(0);
            } catch (err) {
                console.error("❌ Error al cargar departamentos:", err);
                setError("No se pudieron cargar los departamentos.");
                addToast({
                    type: "error",
                    title: "Error al cargar",
                    message: "No se pudieron obtener los datos desde el servidor.",
                });
            } finally {
                setLoading(false);
            }
        }
        loadDepartments();
    }, [page, debouncedSearch]);

    // 🎹 Atajos
    useHotkeys(
        {
            escape: () => {
                if (confirmOpen || showForm) return "prevent";
                navigate("/settings");
            },
            arrowdown: (e) => {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % departments.length);
            },
            arrowup: (e) => {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + departments.length) % departments.length);
            },
            f12: (e) => {
                e.preventDefault();
                setShowForm(true);
            },
            delete: (e) => {
                e.preventDefault();
                const dept = departments[selectedIndex];
                if (dept) handleDeleteClick(dept);
            },
            f1: (e) => {
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
                return "prevent";
            },
        },
        [departments, selectedIndex, confirmOpen, showForm]
    );

    useEffect(() => {
        document.title = "Departamentos | Mirai POS";
    }, []);

    const handleDeleteClick = (dept) => {
        setDepartmentToDelete(dept);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!departmentToDelete) return;
        try {
            await deleteDepartment(departmentToDelete.id);
            setDepartments((prev) => prev.filter((d) => d.id !== departmentToDelete.id));
            setConfirmOpen(false);
            addToast({
                type: "success",
                title: "Departamento eliminado",
                message: `${departmentToDelete.name} fue eliminado correctamente.`,
            });
        } catch (err) {
            console.error("❌ Error al eliminar departamento:", err);
            addToast({
                type: "error",
                title: "Error al eliminar",
                message: "No se pudo eliminar el departamento.",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <p>Cargando departamentos...</p>
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
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto px-6 mt-6"
            >
                {/* 🔙 Volver + Buscar */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <button
                        onClick={() => navigate("/settings")}
                        className="flex items-center gap-1 text-slate-400 hover:text-white transition text-sm cursor-pointer"
                    >
                        <Home size={18} />
                        <ChevronLeft size={16} />
                        <span>Volver a Configuración</span>
                    </button>

                    <h1 className="text-2xl font-semibold text-primary leading-none flex-1">
                        Departamentos
                    </h1>

                    {/* 🔍 Buscar */}
                    <div className="relative flex items-center bg-secondary rounded-lg border border-slate-700">
                        <Search size={16} className="absolute left-2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar departamento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-7 pr-4 py-1 bg-transparent text-slate-200 text-sm outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* ➕ Nuevo */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition"
                    >
                        <PlusCircle size={18} />
                        <span className="font-semibold">F12</span>
                        <span>Agregar</span>
                    </motion.button>
                </div>

                {/* 📋 Listado */}
                {departments.length === 0 ? (
                    <p className="text-center text-slate-400">No se encontraron departamentos.</p>
                ) : (
                    <motion.div
                        key={page}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col gap-3"
                    >
                        {departments.map((dept, index) => {
                            const isSelected = index === selectedIndex;

                            return (
                                <motion.div
                                    key={dept.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`flex justify-between items-center bg-secondary rounded-xl px-4 py-3 cursor-pointer border transition-all ${
                                        isSelected
                                            ? "border-primary ring-2 ring-primary/40 shadow-hard"
                                            : "border-slate-700 hover:border-primary"
                                    }`}
                                >
                                    {/* 📄 Información principal */}
                                    <div className="flex items-start gap-3">
                                        <Layers size={22} className="text-primary mt-1" />
                                        <div>
                                            {/* 🔹 Línea principal */}
                                            <div className="flex items-center flex-wrap gap-x-2">
                                                <p className="font-semibold text-[15px]">{dept.name}</p>

                                                {/* 💰 Margen / Herencia */}
                                                {dept.use_parent_profit_margin ? (
                                                    <span className="flex items-center gap-1 text-[11px] text-slate-400 pt-1.5">
                                                        <span className="mx-1 text-slate-500">•</span> Usa margen del cliente general
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[11px] text-yellow-400 pt-1.5">
                                                        <span className="mx-1 text-yellow-400">•</span> {Number(dept.profit_margin).toFixed(4)}%
                                                    </span>
                                                )}

                                            </div>

                                            {/* 🔹 Línea secundaria */}
                                            <p className="text-xs text-slate-400 mt-[2px]">
                                                {dept.description || "Sin descripción"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 🛠️ Acciones */}
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <span
                                            className={`text-xs px-2 py-[2px] rounded ${
                                                dept.status === "active"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-red-500/20 text-red-400"
                                            }`}
                                        >
                                            {dept.status === "active" ? "Activo" : "Inactivo"}
                                        </span>

                                        <Edit2 size={16} className="hover:text-primary" />
                                        <Trash2
                                            size={16}
                                            className="hover:text-error cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(dept);
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* 📄 Paginación */}
                <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />

                <p className="text-center text-xs text-slate-500 mt-6">
                    Usa ↑ ↓ para navegar · F12 para nuevo · Supr para eliminar
                </p>
            </motion.div>

            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar departamento"
                message={
                    departmentToDelete
                        ? `¿Deseas eliminar "${departmentToDelete.name}"?`
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />

            <DepartmentForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onCreated={() => setPage(1)}
            />
        </div>
    );
}
