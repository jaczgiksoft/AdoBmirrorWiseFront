import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Home, ChevronLeft, PlusCircle, Edit2, Trash2, User, Search } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { ConfirmDialog } from "@/components/feedback";
import { Table, Pagination } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { employeesStorage } from "@/utils/employeesStorage";
import EmployeeFormModal from "./EmployeeFormModal";
import EmployeeUserModal from "./EmployeeUserModal";
import EmployeeFilterDropdown from "./components/EmployeeFilterDropdown";

const MOCK_EMPLOYEES = [
    {
        id: 1,
        first_name: "Adolfo",
        last_name: "Castro",
        second_last_name: "García",
        email: "adolfo@example.com",
        phone: "5551234567",
        position: "Administrador",
        is_appointment_eligible: false,
        status: "active",
        profile_image: null,
        hiring_date: "2023-01-10",
        roleIds: [1],
        has_user: true
    },
    {
        id: 2,
        first_name: "Ana",
        last_name: "López",
        second_last_name: "Pérez",
        email: "ana.lopez@example.com",
        phone: "5559876543",
        position: "Odontóloga",
        is_appointment_eligible: true,
        status: "active",
        profile_image: null,
        hiring_date: "2023-05-20",
        roleIds: [2],
        has_user: true
    },
    {
        id: 3,
        first_name: "Carlos",
        last_name: "Ruiz",
        second_last_name: "",
        email: "cruiz@example.com",
        phone: "5551112233",
        position: "Asistente",
        is_appointment_eligible: false,
        status: "inactive",
        profile_image: null,
        hiring_date: "2024-02-15",
        roleIds: [],
        has_user: false
    }
];

export default function EmployeeList() {
    const navigate = useNavigate();
    const { addToast } = useToastStore();

    /**
     * ⚠️ TEMPORAL - MOCK STORAGE
     * Esta implementación usa localStorage para simular persistencia de datos.
     * 
     * 📌 IMPORTANTE:
     * - Esto es un MOCK temporal para desarrollo.
     * - Debe eliminarse completamente cuando se conecte a un backend real (API).
     * - Reemplazar por llamadas a servicios (GET, POST, PUT, DELETE).
     * - Diseñado para ser removido fácilmente sin afectar la lógica de los componentes.
     */
    const [employees, setEmployees] = useState(() => employeesStorage.get(MOCK_EMPLOYEES));

    // Sincronizar cambios a localStorage cada vez que la lista se modifique
    useEffect(() => {
        employeesStorage.save(employees);
    }, [employees]);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [userFilter, setUserFilter] = useState("all"); // New filter
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "first_name", direction: "asc" });
    const ITEMS_PER_PAGE = 10;

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

    const handleSaveUserAccount = (userAccount) => {
        const updatedEmployees = employees.map(emp =>
            emp.id === selectedUserEmployee.id
                ? { ...emp, has_user: true, user_account: userAccount }
                : emp
        );
        setEmployees(updatedEmployees);
    };

    const handleConfirmDelete = () => {
        if (!employeeToDelete) return;

        setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
        setConfirmOpen(false);
        setEmployeeToDelete(null);

        addToast({
            type: "success",
            title: "Empleado eliminado",
            message: `${employeeToDelete.first_name} ${employeeToDelete.last_name} fue eliminado.`,
        });
    };

    const handleSaveEmployee = (employeeData) => {
        if (selectedEmployee) {
            // Update
            setEmployees(employees.map(emp => emp.id === employeeData.id ? employeeData : emp));
        } else {
            // Create
            setEmployees([employeeData, ...employees]);
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
                (emp.position || "").toLowerCase().includes(term)
            );
        })();

        const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
        const matchesUser = userFilter === "all" ||
            (userFilter === "with_user" && emp.has_user) ||
            (userFilter === "without_user" && !emp.has_user);

        return matchesSearch && matchesStatus && matchesUser;
    });

    // Sorting Logic
    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = (a[sortConfig.key] || "").toString().toLowerCase();
        const bValue = (b[sortConfig.key] || "").toString().toLowerCase();

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
                        <img src={row.profile_image} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800" />
                    ) : (
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full border border-slate-700 text-primary ${row.has_user ? "bg-primary/10 shadow-[0_0_10px_rgba(14,165,233,0.3)]" : "bg-slate-800"}`}>
                            <User size={20} />
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-slate-100">
                            {row.first_name} {row.last_name} {row.second_last_name}
                        </p>
                        <p className="text-xs text-slate-400">{row.email || "Sin correo"}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Puesto",
            accessor: "position",
            sortable: true,
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm">{row.position || "N/A"}</span>
                    {row.is_appointment_eligible && (
                        <span className="text-[10px] text-sky-400">Atiende citas</span>
                    )}
                </div>
            )
        },
        {
            header: "Teléfono",
            accessor: "phone",
            sortable: true,
            render: (row) => <span className="text-slate-300">{row.phone || "N/A"}</span>
        },
        {
            header: "Contratación",
            accessor: "hiring_date",
            sortable: true,
            render: (row) => (
                <span className="text-slate-300">
                    {row.hiring_date ? new Date(row.hiring_date).toLocaleDateString("es-MX") : "N/A"}
                </span>
            )
        },
        {
            header: "Estado",
            accessor: "status",
            sortable: true,
            render: (row) => {
                const isActive = row.status === "active";
                return (
                    <span className={`text-xs px-2 py-1 rounded inline-block ${isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {isActive ? "Activo" : "Inactivo"}
                    </span>
                );
            }
        },
        {
            header: "Acciones",
            accessor: "actions",
            render: (row) => (
                <div className="flex items-center gap-3 text-slate-400">
                    <button
                        onClick={() => handleUserClick(row)}
                        className={`transition-colors cursor-pointer ${row.has_user ? "text-green-500 hover:text-green-400" : "text-slate-500 hover:text-primary"}`}
                        title={row.has_user ? "Ver / editar usuario" : "Crear usuario"}
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
                        className="hover:text-error transition-colors cursor-pointer"
                        title="Eliminar"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="bg-dark min-h-screen flex flex-col font-sans text-slate-50">
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
                        <div className="relative flex items-center bg-secondary rounded-lg border border-slate-700 transition-all focus-within:ring-2 focus-within:ring-primary/50">
                            <Search size={16} className="absolute left-3 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar empleado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-20 py-2.5 bg-transparent text-slate-200 text-sm outline-none placeholder:text-slate-500 w-48 md:w-64"
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
