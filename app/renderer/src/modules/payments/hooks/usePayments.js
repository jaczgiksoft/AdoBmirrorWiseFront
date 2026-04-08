import { useState, useCallback, useEffect, useMemo } from "react";
import { getPayments, createPayment } from "../services/paymentService";

const PAGE_SIZE = 10;

export function usePayments() {
    // ── Raw data state ──────────────────────────────────────────────────────
    const [allPayments, setAllPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // ── Filter state ────────────────────────────────────────────────────────
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterMethod, setFilterMethod] = useState("all");
    const [filterInvoiced, setFilterInvoiced] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    // ── Pagination state ─────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const pageSize = PAGE_SIZE;

    // ── Selection & Action state ──────────────────────────────────────────────
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [invoicingPayment, setInvoicingPayment] = useState(null);

    // ── Data fetching ───────────────────────────────────────────────────────
    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPayments();
            setAllPayments(data);
        } catch (error) {
            console.error("Error fetching payments", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // ── Reset to page 1 when filters change ──────────────────────────────────
    useEffect(() => {
        setPage(1);
    }, [filterStatus, filterMethod, filterInvoiced, searchTerm, dateRange]);

    // ── Mock creation action ────────────────────────────────────────────────
    const handleCreateMockPayment = async () => {
        setActionLoading(true);
        try {
            await createPayment({
                source_type: "treatment",
                method: "tarjeta"
            });

            await fetchPayments();
        } catch (error) {
            console.error("Error creating mock payment", error);
        } finally {
            setActionLoading(false);
        }
    };

    // ── Invoice toggle — optimistic in-memory mutation ───────────────────────
    const handleMarkInvoiced = useCallback((paymentId, invoiceData) => {
        setAllPayments(prev =>
            prev.map(p => p.id === paymentId ? { ...p, invoiced: true, invoice: invoiceData } : p)
        );
        // Also update selectedPayment if it's the same record, so modal reflects change
        setSelectedPayment(prev =>
            prev?.id === paymentId ? { ...prev, invoiced: true, invoice: invoiceData } : prev
        );
        setInvoicingPayment(null);
    }, []);

    // ── KPI calculations — memoized from the FULL unfiltered list ───────────
    const kpis = useMemo(() => {
        const totalIngresos = allPayments
            .filter(p => p.status === "paid")
            .reduce((sum, p) => sum + (p.received ?? 0), 0);

        const paid = allPayments.filter(p => p.status === "paid").length;
        const partial = allPayments.filter(p => p.status === "partial").length;
        const pending = allPayments.filter(p => p.status === "pending").length;

        const total_invoiced = allPayments.filter(p => p.invoiced).reduce((sum, p) => sum + (p.total ?? 0), 0);
        const total_not_invoiced = allPayments.filter(p => !p.invoiced && p.status !== "pending").reduce((sum, p) => sum + (p.total ?? 0), 0);
        const invoices_count = allPayments.filter(p => p.invoiced).length;
        const non_invoiced_count = allPayments.filter(p => !p.invoiced && p.status !== "pending").length;

        const total_expected = allPayments.reduce((sum, p) => sum + (p.total ?? 0), 0);
        const total_collected = allPayments.reduce((sum, p) => sum + (p.received ?? 0), 0);
        const accounts_receivable = allPayments.reduce((sum, p) => sum + Math.max(0, (p.total ?? 0) - (p.received ?? 0)), 0);

        return {
            totalIngresos, paid, partial, pending, total: allPayments.length,
            total_invoiced, total_not_invoiced, invoices_count, non_invoiced_count,
            total_expected, total_collected, accounts_receivable
        };
    }, [allPayments]);

    // ── Today's Stats ────────────────────────────────────────────────────────
    const todayStats = useMemo(() => {
        const today = new Date();

        const todayPayments = allPayments.filter(p => {
            if (!p.created_at) return false;
            const pDate = new Date(p.created_at);
            return (
                pDate.getDate() === today.getDate() &&
                pDate.getMonth() === today.getMonth() &&
                pDate.getFullYear() === today.getFullYear()
            );
        });

        const total = todayPayments.reduce((sum, p) => sum + (p.received ?? 0), 0);
        const count = todayPayments.length;
        const uniquePatients = new Set(
            todayPayments
                .map(p => p.patient_name ?? p.ticket?.patient)
                .filter(Boolean)
        ).size;

        return { total, count, patients: uniquePatients };
    }, [allPayments]);

    // ── Filtered view — memoized, applies all filters ────────────────────────
    const payments = useMemo(() => {
        return allPayments.filter(p => {
            const statusMatch = filterStatus === "all" || p.status === filterStatus;
            const methodMatch = filterMethod === "all" || p.method === filterMethod;

            let invoicedMatch = true;
            if (filterInvoiced === "invoiced") invoicedMatch = p.invoiced === true;
            if (filterInvoiced === "not_invoiced") invoicedMatch = p.invoiced === false;

            const searchLow = (searchTerm || "").toLowerCase().trim();
            const searchMatch = !searchLow || (p.patient_name || "").toLowerCase().includes(searchLow) || (p.id || "").toLowerCase().includes(searchLow);

            let dateMatch = true;
            if (dateRange?.startDate && dateRange?.endDate) {
                const pDate = new Date(p.created_at);
                const start = new Date(dateRange.startDate);
                const end = new Date(dateRange.endDate);
                end.setHours(23, 59, 59, 999);
                dateMatch = pDate >= start && pDate <= end;
            }

            return statusMatch && methodMatch && invoicedMatch && searchMatch && dateMatch;
        });
    }, [allPayments, filterStatus, filterMethod, filterInvoiced, searchTerm, dateRange]);

    // ── Pagination — derived from filtered list ───────────────────────────────
    const totalPages = useMemo(() => Math.max(1, Math.ceil(payments.length / pageSize)), [payments.length, pageSize]);

    const paginatedPayments = useMemo(() => {
        const start = (page - 1) * pageSize;
        return payments.slice(start, start + pageSize);
    }, [payments, page, pageSize]);

    return {
        payments,
        paginatedPayments,
        loading,
        actionLoading,
        kpis,
        todayStats,
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
        pageSize,
        totalPages,
        selectedPayment,
        setSelectedPayment,
        invoicingPayment,
        setInvoicingPayment,
        handleCreateMockPayment,
        handleMarkInvoiced,
    };
}
