import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Edit2, Trash2, User, Search, Briefcase, Shield } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { Table, Pagination } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getEmployees, deleteEmployee, createEmployee, updateEmployee } from "@/services/employee.service";
import { createUser, updateUser } from "@/services/user.service";
import EmployeeFormModal from "./EmployeeFormModal";
import EmployeeUserModal from "./EmployeeUserModal";
import EmployeeFilterDropdown from "./components/EmployeeFilterDropdown";

export default function EmployeeList() {
    const navigate = useNavigate();
    const { addToast } = useToastStore();

    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [userFilter, setUserFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "first_name", direction: "asc" });
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const data = await getEmployees();
            setEmployees(data);
        } catch (err) {
            addToast({
                type: "error",
                title: "Error",
                message: "No se pudieron cargar los empleados.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, userFilter]);

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Delete states
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    // Actions
    const handleAddClick = () => {
        setSelectedEmployee(null);
        setShowForm(true);
    };

    const handleEditClick = (employee) => {
        setSelectedEmployee(employee);
        setShowForm(true);
    };

    const handleDeleteClick = (employee) => {
        setEmployeeToDelete(employee);
        setConfirmOpen(true);
    };

    // --- User Account Modal ---
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUserEmployee, setSelectedUserEmployee] = useState(null);

    const handleUserClick = (employee) => {
        setSelectedUserEmployee(employee);
        setShowUserModal(true);
    };

    const handleSaveUserAccount = async (userAccount) => {
        try {
            if (selectedUserEmployee.user) {
                await updateUser(selectedUserEmployee.user.id, userAccount);
            } else {
                await createUser({ 
                    ...userAccount, 
                    employee_id: selectedUserEmployee.id,
                    // Si el usuario no ingresó nombre, podemos usar el email del empleado
                    username: userAccount.username || selectedUserEmployee.email
                });
            }
            fetchEmployees(); 
            setShowUserModal(false);
        } catch (err) {
            addToast({
                type: "error",
                title: "Error",
                message: err.message || "No se pudo vincular la cuenta de usuario.",
            });
        }
    };

    const handleConfirmDelete = async () => {
        if (!employeeToDelete) return;

        try {
            await deleteEmployee(employeeToDelete.id);
            addToast({
                type: "success",
                title: "Empleado eliminado",
                message: `${employeeToDelete.first_name} ${employeeToDelete.last_name} fue eliminado.`,
            });
            fetchEmployees();
        } catch (err) {
            addToast({
                type: "error",
                title: "Error",
                message: "No se pudo eliminar el empleado.",
            });
        } finally {
            setConfirmOpen(false);
            setEmployeeToDelete(null);
        }
    };

    const handleSaveEmployee = async (employeeData) => {
        try {
            if (selectedEmployee) {
                await updateEmployee(selectedEmployee.id, employeeData);
            } else {
                await createEmployee(employeeData);
            }
            fetchEmployees();
            setShowForm(false);
        } catch (err) {
            // El modal ya muestra errores o lanza toast si es necesario, 
            // pero aquí recargamos para asegurar consistencia
            console.error("Error saving employee:", err);
        }
    };

    // Filter logic
    const filteredEmployees = employees.filter((emp) => {
        const matchesSearch = (() => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                emp.first_name.toLowerCase().includes(term) ||
                emp.last_name.toLowerCase().includes(term) ||
                (emp.email || "").toLowerCase().includes(term) ||
                (emp.role?.name || "").toLowerCase().includes(term) ||
                (emp.positions || []).some(p => p.name.toLowerCase().includes(term))
            );
        })();

        const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
        const matchesUser = userFilter === "all" ||
            (userFilter === "with_user" && emp.user) ||
            (userFilter === "without_user" && !emp.user);

        return matchesSearch && matchesStatus && matchesUser;
    });

    // Sorting Logic
    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = (a[sortConfig.key] || "").toString().toLowerCase();
        let bValue = (b[sortConfig.key] || "").toString().toLowerCase();

        if (sortConfig.key === 'role') {
            aValue = (a.role?.name || "").toLowerCase();
            bValue = (b.role?.name || "").toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    // Pagination Logic
    const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE);
    const paginatedEmployees = sortedEmployees.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Actions
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    // Table Columns Configuration
    const columns = [
        {
            header: "Empleado",
            accessor: "first_name",
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-3">
                    {row.profile_image ? (
                        <img src={row.profile_image} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800" />
                    ) : (
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-primary ${row.user ? "bg-primary/10 shadow-[0_0_10px_rgba(14,165,233,0.3)]" : "bg-slate-100 dark:bg-slate-800"}`}>
                            <User size={20} />
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.first_name} {row.last_name} {row.second_last_name}
                        </p>
                        <p className="text-xs text-slate-400">{row.email || "Sin correo"}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Rol y Puestos",
            accessor: "role",
            sortable: false,
            render: (row) => (
                <div className="flex flex-col gap-1.5">
                    {/* Rol Principal */}
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Shield size={12} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">{row.role?.name || "Sin Rol"}</span>
                    </div>
                    {/* Puestos como Badges */}
                    <div className="flex flex-wrap gap-1">
                        {row.positions && row.positions.length > 0 ? (
                            row.positions.map(p => (
                                <span 
                                    key={p.id} 
                                    className="text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1"
                                    style={{ 
                                        backgroundColor: `${p.color}15`, 
                                        borderColor: `${p.color}40`,
                                        color: p.color 
                                    }}
                                >
                                    <Briefcase size={8} />
                                    {p.name}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin puestos</span>
                        )}
                    </div>
                    {row.is_appointment_eligible && (
                        <span className="text-[9px] font-bold text-sky-500 uppercase">Elegible para citas</span>
                    )}
                </div>
            )
        },
        {
            header: "Teléfono",
            accessor: "phone",
            sortable: true,
            render: (row) => <span className="text-slate-600 dark:text-slate-300">{row.phone || "N/A"}</span>
        },
        {
            header: "Estado",
            accessor: "status",
            sortable: true,
            render: (row) => {
                const isActive = row.status === "active";
                return (
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded inline-block ${isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                        {isActive ? "Activo" : "Inactivo"}
                    </span>
                );
            }
        },
        {
            header: "Acciones",
            accessor: "actions",
            render: (row) => (
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <button
                        onClick={() => handleUserClick(row)}
                        className={`transition-colors cursor-pointer ${row.user ? "text-emerald-500 hover:text-emerald-400" : "text-slate-500 hover:text-primary"}`}
                        title={row.user ? "Ver / editar usuario" : "Crear usuario"}
                    >
                        <User size={18} />
                    </button>
                    <button
                        onClick={() => handleEditClick(row)}
                        className="hover:text-primary transition-colors cursor-pointer"
                        title="Editar"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row)}
                        className="hover:text-rose-500 transition-colors cursor-pointer"
                        title="Eliminar"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="bg-slate-50 dark:bg-dark min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-6xl mx-auto px-6 mt-6 pb-20"
            >
                {/* Header Actions Row */}
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                    <PageHeader
                        title="Gestión de Empleados"
                        subtitle="Administra el personal y cuentas de usuario"
                        onBack={() => navigate("/dashboard")}
                    />

                    <div className="flex items-center gap-3">
                        {/* 🔍 Buscar y Filtros Group */}
                        <div className="relative flex items-center bg-white dark:bg-secondary rounded-lg border border-slate-200 dark:border-slate-700 transition-all focus-within:ring-2 focus-within:ring-primary/50">
                            <Search size={16} className="absolute left-3 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar empleado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-20 py-2.5 bg-transparent text-slate-800 dark:text-slate-200 text-sm outline-none placeholder:text-slate-500 w-48 md:w-64"
                            />
                            <div className="absolute right-1">
                                <EmployeeFilterDropdown
                                    filters={{ statusFilter, userFilter }}
                                    onApply={(f) => {
                                        setStatusFilter(f.statusFilter);
                                        setUserFilter(f.userFilter);
                                    }}
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleAddClick}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            <PlusCircle size={18} />
                            <span>Agregar empleado</span>
                        </motion.button>
                    </div>
                </div>

                {/* Table View */}
                <Table
                    columns={columns}
                    data={paginatedEmployees}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    isLoading={isLoading}
                    emptyMessage="No se encontraron empleados que coincidan con la búsqueda."
                />

                {/* Pagination Controls */}
                <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />

            </motion.div>

            {/* Modal de Formulario */}
            <EmployeeFormModal
                open={showForm}
                onClose={() => setShowForm(false)}
                employee={selectedEmployee}
                onSave={handleSaveEmployee}
            />

            {/* Modal de Usuario */}
            <EmployeeUserModal
                open={showUserModal}
                onClose={() => setShowUserModal(false)}
                employee={selectedUserEmployee}
                onSave={handleSaveUserAccount}
            />

            {/* Modal de Confirmación de Eliminación */}
            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar empleado"
                message={
                    employeeToDelete
                        ? `¿Deseas eliminar a "${employeeToDelete.first_name} ${employeeToDelete.last_name}"?`
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />
        </div>
    );
}
