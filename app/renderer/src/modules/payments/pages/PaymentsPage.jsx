import React, { useCallback, useState } from "react";
import { CreditCard, RefreshCcw, HandCoins, Eye, FileCheck2, BadgeCheck, FileX, Search } from "lucide-react";
import Datepicker from "react-tailwindcss-datepicker";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import { usePayments } from "../hooks/usePayments";
import { formatCurrency } from "../utils/formatCurrency";
import PaymentKPICards from "../components/PaymentKPICards";
import PaymentDetailModal from "../components/PaymentDetailModal";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import TodaySummaryCard from "../components/TodaySummaryCard";
import PaymentsStats from "../components/PaymentsStats";

// ── Static constants — defined outside component to prevent recreation ──────

const STATUS_OPTIONS = [
    { value: "all", label: "Todos" },
    { value: "paid", label: "Pagados" },
    { value: "partial", label: "Parciales" },
    { value: "pending", label: "Pendientes" },
];

const METHOD_OPTIONS = [
    { value: "all", label: "Todos los métodos" },
    { value: "efectivo", label: "Efectivo" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "transferencia", label: "Transferencia" },
];

const INVOICED_OPTIONS = [
    { value: "all", label: "Todas" },
    { value: "invoiced", label: "Facturadas" },
    { value: "not_invoiced", label: "Sin Facturar" },
];

const STATUS_BADGE = {
    paid: { label: "Pagado", cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" },
    partial: { label: "Parcial", cls: "bg-amber-100   text-amber-700   border-amber-200   dark:bg-amber-900/30   dark:text-amber-400   dark:border-amber-800" },
    pending: { label: "Pendiente", cls: "bg-rose-100    text-rose-700    border-rose-200    dark:bg-rose-900/30    dark:text-rose-400    dark:border-rose-800" },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
    const {
        payments,
        paginatedPayments,
        loading,
        actionLoading,
        kpis,
        filterStatus,
        setFilterStatus,
        filterMethod,
        setFilterMethod,
        filterInvoiced,
        setFilterInvoiced,
        searchTerm,
        setSearchTerm,
        dateRange,
        setDateRange,
        page,
        setPage,
        totalPages,
        selectedPayment,
        setSelectedPayment,
        invoicingPayment,
        setInvoicingPayment,
        handleCreateMockPayment,
        handleMarkInvoiced,
        todayStats,
    } = usePayments();

    // ── Tab state (local UI only) ───────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("summary");

    // ── Stable action callbacks ─────────────────────────────────────────────
    const handleSelectPayment = useCallback(
        (payment) => setSelectedPayment(payment),
        [setSelectedPayment]
    );

    const handleCloseModal = useCallback(
        () => setSelectedPayment(null),
        [setSelectedPayment]
    );

    const handleCloseInvoiceModal = useCallback(
        () => setInvoicingPayment(null),
        [setInvoicingPayment]
    );

    // ── Column definitions ──────────────────────────────────────────────────
    // NOTE: These recreate when handleSelectPayment/handleMarkInvoiced change,
    // but those are stable useCallback refs — so this is effectively static.
    const columns = [
        {
            header: "Fecha",
            accessor: "created_at",
            render: (row) => (
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                    {new Date(row.created_at).toLocaleDateString("es-MX")}
                </span>
            ),
        },
        {
            header: "Paciente",
            accessor: "patient_name",
            render: (row) => (
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {row.patient_name ?? row.ticket?.patient ?? "Desconocido"}
                </span>
            ),
        },
        {
            header: "Método",
            accessor: "method",
            render: (row) => (
                <span className="capitalize text-slate-600 dark:text-slate-300">{row.method}</span>
            ),
        },
        {
            header: "Total",
            accessor: "total",
            render: (row) => (
                <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(row.total)}
                </span>
            ),
        },
        {
            header: "Estatus",
            accessor: "status",
            render: (row) => {
                const cfg = STATUS_BADGE[row.status];
                return cfg ? (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
                        {cfg.label}
                    </span>
                ) : (
                    <span className="text-slate-400 text-xs">{row.status}</span>
                );
            },
        },
        {
            header: "Facturado",
            accessor: "invoiced",
            render: (row) => row.invoiced ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                    <BadgeCheck size={14} /> Sí
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <FileX size={14} /> No
                </span>
            ),
        },
        {
            header: "",
            accessor: "actions",
            render: (row) => (
                <div className="flex items-center gap-1.5">
                    {/* View — always visible */}
                    <button
                        onClick={() => handleSelectPayment(row)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-primary border border-primary/30 hover:bg-primary/10 transition"
                    >
                        <Eye size={12} />
                        Ver
                    </button>

                    {/* Invoice — only if not invoiced AND not pending */}
                    {!row.invoiced && row.status !== "pending" && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setInvoicingPayment(row);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/10 transition"
                        >
                            <FileCheck2 size={12} />
                            Facturar
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="p-8 h-full flex flex-col bg-slate-50 dark:bg-dark">

            {/* ── PAGE HEADER ── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-xl">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pagos</h1>
                        <p className="text-sm text-slate-500">Historial y registro central de ingresos</p>
                    </div>
                </div>

                <button
                    onClick={handleCreateMockPayment}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                    {actionLoading ? (
                        <><RefreshCcw size={16} className="animate-spin" /> Registrando...</>
                    ) : (
                        <><HandCoins size={16} /> Crear Pago (Mock)</>
                    )}
                </button>
            </div>

            {/* ── SUMMARY CARDS ── */}
            <TodaySummaryCard stats={todayStats} />
            <PaymentKPICards kpis={kpis} />

            {/* ── TABS ── */}
            <div className="flex items-center gap-1 mb-4 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-lg w-fit">
                {[{ key: "summary", label: "Resumen" }, { key: "stats", label: "Estadísticas" }].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${activeTab === tab.key
                            ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── RESUMEN TAB ── */}
            {activeTab === "summary" && (
                <>
                    {/* ── FILTERS ── */}
                    <div className="space-y-3 mb-5">
                        {/* Row 1: Filter Pills & Results */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Status filter */}
                            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-lg">
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilterStatus(opt.value)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${filterStatus === opt.value
                                            ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Method filter */}
                            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-lg">
                                {METHOD_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilterMethod(opt.value)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${filterMethod === opt.value
                                            ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Invoiced filter */}
                            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-lg">
                                {INVOICED_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilterInvoiced(opt.value)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${filterInvoiced === opt.value
                                            ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <span className="ml-auto text-sm text-slate-400 dark:text-slate-500">
                                Mostrando {paginatedPayments.length} de {payments.length} resultado{payments.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Row 2: Search & Date Range */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 max-w-md flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark transition-all focus-within:ring-2 focus-within:ring-cyan-500/50">
                                <Search size={16} className="absolute left-3 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar paciente o ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                            </div>

                            <div className="w-64 z-40">
                                <Datepicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                    showShortcuts={true}
                                    useRange={true}
                                    displayFormat={"DD/MM/YYYY"}
                                    i18n={"es"}
                                    inputClassName="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    placeholder="Rango de fechas..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── TABLE + PAGINATION ── */}
                    <div className="flex-1 bg-white dark:bg-secondary rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">

                        <div className="flex-1 overflow-auto">
                            <Table
                                columns={columns}
                                data={paginatedPayments}
                                loading={loading}
                                emptyMessage="No hay pagos con los filtros seleccionados."
                                onRowClick={handleSelectPayment}
                            />
                        </div>

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                </>
            )}

            {/* ── ESTADÍSTICAS TAB ── */}
            {activeTab === "stats" && <PaymentsStats />}

            {/* ── DETAIL MODAL ── */}
            <PaymentDetailModal
                payment={selectedPayment}
                onClose={handleCloseModal}
            />

            {/* ── INVOICE PREVIEW MODAL ── */}
            <InvoicePreviewModal
                payment={invoicingPayment}
                onClose={handleCloseInvoiceModal}
                onConfirm={handleMarkInvoiced}
            />

        </div>
    );
}
