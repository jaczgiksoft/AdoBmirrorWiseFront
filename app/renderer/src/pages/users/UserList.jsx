// src/pages/settings/users/UserList.jsx
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { getUsersPaginated, deleteUser } from "@/services/user.service";
import UserForm from "./UserForm";
import FilterDropdown from "@/pages/stores/FilterDropdown"; // Reutilizado
import { PlusCircle, ChevronLeft, User, Edit2, Trash2, Search, Home } from "lucide-react";
import { Pagination } from "@/components/ui";
import { API_BASE } from "@/utils/apiBase";

export default function UserList() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1 });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [filters, setFilters] = useState({});
    const searchRef = useRef(null);
    const { addToast } = useToastStore();
    const limit = 5;

    // 🔹 Debounce para búsqueda
    useEffect(() => {
        const delay = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    // 🔹 Cargar usuarios paginados
    useEffect(() => {
        async function loadUsers() {
            try {
                if (users.length === 0 && page === 1 && !debouncedSearch) {
                    setLoading(true);
                }

                const start = (page - 1) * limit;
                const res = await getUsersPaginated({
                    start,
                    length: limit,
                    searchValue: debouncedSearch,
                    orderColumn: "first_name",
                    orderDir: "ASC",
                    ...filters,
                });

                setUsers(res.rows || res.data || []);
                setPagination({
                    total: res.recordsFiltered || 0,
                    totalPages: Math.ceil((res.recordsFiltered || 0) / limit) || 1,
                });
                setSelectedIndex(0);
            } catch (err) {
                console.error("❌ Error al cargar usuarios:", err);
                setError("No se pudieron cargar los usuarios.");
                addToast({
                    type: "error",
                    title: "Error al cargar usuarios",
                    message: "No se pudieron obtener los datos desde el servidor.",
                });
            } finally {
                setLoading(false);
            }
        }

        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, filters]);

    // 🎹 Hotkeys
    useHotkeys(
        {
            escape: () => {
                if (confirmOpen || showForm) return "prevent";
                navigate("/dashboard");
            },
            arrowdown: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % users.length);
            },
            arrowup: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
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
                const user = users[selectedIndex];
                if (user) navigate(`/settings/users/${user.id}/editar`);
            },
            f12: (e) => {
                if (confirmOpen) return "prevent";
                e.preventDefault();
                setShowForm(true);
            },
            delete: (e) => {
                e.preventDefault();
                const user = users[selectedIndex];
                if (user) handleDeleteClick(user);
            },
            f1: (e) => {
                if (confirmOpen || showForm) return "prevent";
                e.preventDefault();

                if (e.ctrlKey) {
                    // 🧩 Ctrl + F1 → abre/cierra filtros avanzados
                    const btn = document.querySelector(".filter-toggle-btn");
                    btn?.click();
                } else {
                    // 🔍 F1 normal → enfoca búsqueda
                    searchRef.current?.focus();
                    searchRef.current?.select();
                }

                return "prevent";
            },
        },
        [users, selectedIndex, confirmOpen, showForm]
    );

    useEffect(() => {
        document.title = "Usuarios | Mirai POS";
    }, []);

    // 🗑 Confirmar eliminación
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(userToDelete.id);
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            setConfirmOpen(false);
            setUserToDelete(null);

            addToast({
                type: "success",
                title: "Usuario eliminado",
                message: `${userToDelete.first_name} ${userToDelete.last_name} fue eliminado correctamente.`,
            });
        } catch (err) {
            console.error("❌ Error al eliminar usuario:", err);
            addToast({
                type: "error",
                title: "Error al eliminar usuario",
                message:
                    err.response?.data?.message ||
                    "No se pudo eliminar el usuario. Verifica tu conexión o permisos.",
            });
        }
    };

    // 🧩 Usuario creado → recargar primera página
    const handleUserCreated = () => {
        setShowForm(false);
        setPage(1);
    };

    // 🌀 Carga y error
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-400">
                <p>Cargando usuarios...</p>
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
                        onClick={() => navigate("/dashboard")}
                        className="relative group flex items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                        <Home size={18} className="relative top-[1px]" />
                        <ChevronLeft size={16} className="relative top-[1px]" />
                        <span className="absolute left-full ml-3 whitespace-nowrap px-3 py-1.5 text-xs bg-black/85 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
                            Ir al panel principal del sistema
                        </span>
                    </button>

                    <h1 className="text-2xl font-semibold text-primary leading-none flex-1">
                        Gestión de usuarios
                    </h1>

                    {/* 🔍 Buscar + Filtros */}
                    <div className="relative flex items-center bg-secondary rounded-lg border border-slate-700">
                        <Search size={16} className="absolute left-2 text-slate-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Buscar usuario..."
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

                    {/* ➕ Nuevo usuario */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition"
                    >
                        <PlusCircle size={18} />
                        <span className="font-semibold">F12</span>
                        <span>Agregar usuario</span>
                    </motion.button>
                </div>

                {/* 📋 Listado */}
                {users.length === 0 ? (
                    <p className="text-center text-slate-400">No se encontraron usuarios.</p>
                ) : (
                    <motion.div
                        key={page}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col gap-3"
                    >
                        {users.map((user, index) => {
                            const isSelected = index === selectedIndex;
                            const profileSrc = user.profile_image
                                ? `${API_BASE}${user.profile_image}`
                                : null;

                            return (
                                <motion.div
                                    key={user.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => navigate(`/settings/users/${user.id}/editar`)}
                                    className={`flex justify-between items-center bg-secondary rounded-xl px-4 py-3 cursor-pointer border transition-all
                                    ${
                                        isSelected
                                            ? "border-primary ring-2 ring-primary/40 shadow-hard"
                                            : "border-slate-700 hover:border-primary"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {profileSrc ? (
                                            <img
                                                src={profileSrc}
                                                alt={user.username}
                                                className="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-800"
                                                onError={(e) => (e.target.style.display = "none")}
                                            />
                                        ) : (
                                            <User size={35} className="text-primary" />
                                        )}

                                        <div>
                                            <p className="font-semibold">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {user.role?.name || "Sin rol"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-400">
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${
                                                user.status === "active"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-red-500/20 text-red-400"
                                            }`}
                                        >
                                            {user.status === "active" ? "Activo" : "Inactivo"}
                                        </span>
                                        <Edit2 size={16} className="hover:text-primary" />
                                        <Trash2
                                            size={16}
                                            className="hover:text-error cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(user);
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

            {/* 🧱 Confirmación de eliminación */}
            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar usuario"
                message={
                    userToDelete
                        ? `¿Deseas eliminar a "${userToDelete.first_name} ${userToDelete.last_name}"?`
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />

            {/* 🧾 Formulario modal */}
            <UserForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onCreated={handleUserCreated}
            />
        </div>
    );
}
