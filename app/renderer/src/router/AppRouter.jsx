// src/router/AppRouter.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useToastStore } from "@/store/useToastStore";

import SplashScreen from "@/pages/SplashScreen";
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/dashboard/Dashboard";
import Settings from "@/pages/Settings";
import UsersAndRoles from "@/pages/settings/UsersAndRoles";
import Departments from "@/pages/settings/Departments";
import DepartmentList from "@/pages/settings/departments/DepartmentList";
import UserList from "@/pages/users/UserList";
import StoreList from "@/pages/stores/StoreList";
import StoreDetail from "@/pages/stores/StoreDetail";
import CashRegisterList from "@/pages/cashRegisters/CashRegisterList";
import CashRegisterDetail from "@/pages/cashRegisters/CashRegisterDetail";

import PatientList from "@/pages/patients/PatientList";
import PatientDetail from "@/pages/patients/PatientDetail";

// Paciente (secciones internas)
import SummarySection from "@/pages/patients/PatientDetail/sections/SummarySection";
import GeneralSection from "@/pages/patients/PatientDetail/sections/GeneralSection";
import ClinicalSection from "@/pages/patients/PatientDetail/sections/ClinicalSection";
import FamilySection from "@/pages/patients/PatientDetail/sections/FamilySection";
import AlertsSection from "@/pages/patients/PatientDetail/sections/AlertsSection";
import AppointmentsSection from "@/pages/patients/PatientDetail/sections/AppointmentsSection";
import PrescriptionsSection from "@/pages/patients/PatientDetail/sections/PrescriptionsSection";
import ContractsSection from "@/pages/patients/PatientDetail/sections/ContractsSection";
import TreatmentPlanSection from "@/pages/patients/PatientDetail/sections/TreatmentPlanSection";
import BudgetsSection from "@/pages/patients/PatientDetail/sections/BudgetsSection";
import HobbiesSection from "@/pages/patients/PatientDetail/sections/HobbiesSection";
import ConversationsSection from "@/pages/patients/PatientDetail/sections/ConversationsSection";
import NotesSection from "@/pages/patients/PatientDetail/sections/NotesSection";
import GallerySection from "@/pages/patients/PatientDetail/sections/GallerySection";
import ExtractionOrdersSection from "@/pages/patients/PatientDetail/sections/ExtractionOrdersSection";
import OdontogramSection from "@/pages/patients/PatientDetail/sections/OdontogramSection";
import ElasticsSection from "@/pages/patients/PatientDetail/sections/ElasticsSection";
import AccountSection from "@/pages/patients/PatientDetail/sections/AccountSection";

import ToastContainer from "@/components/ui/ToastContainer";
import { Header, QuickAccessBar } from "@/components/layout";
import RepresentativesSection from "@/pages/patients/PatientDetail/sections/RepresentativesSection";
import BillingSection from "@/pages/patients/PatientDetail/sections/BillingSection";

/* ──────────────────────────────────────────────
 🔒 RUTA PRIVADA
 Protege las rutas que requieren autenticación.
────────────────────────────────────────────── */
function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuthStore();
    if (loading) return <SplashScreen />;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/* ──────────────────────────────────────────────
 ⚙️ PUENTE IPC
 Escucha eventos enviados desde el proceso principal de Electron.
────────────────────────────────────────────── */
function IpcRouterBridge() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!window.electronAPI?.on) return;

        // Limpia listeners previos
        if (window.electronAPI.removeAllListeners) {
            window.electronAPI.removeAllListeners("app:open-settings");
        }

        const handleOpenSettings = () => {
            const canAccess = user?.permissions?.settings?.read;
            if (canAccess) navigate("/settings");
        };

        window.electronAPI.on("app:open-settings", handleOpenSettings);

        return () => {
            if (window.electronAPI.removeListener) {
                window.electronAPI.removeListener("app:open-settings", handleOpenSettings);
            } else if (window.electronAPI.removeAllListeners) {
                window.electronAPI.removeAllListeners("app:open-settings");
            }
        };
    }, [navigate, user]);

    return null;
}

/* ──────────────────────────────────────────────
 🧭 ROUTER PRINCIPAL
 Define todas las rutas públicas y protegidas del sistema.
────────────────────────────────────────────── */
export default function AppRouter() {
    const { toasts, removeToast } = useToastStore();
    const { isAuthenticated } = useAuthStore();
    const { connectSocket, disconnectSocket, fetchNotifications } = useNotificationStore();

    // 🔌 Conecta el WebSocket al iniciar sesión
    useEffect(() => {
        if (!isAuthenticated) return;

        const { socket } = useNotificationStore.getState();
        if (!socket || !socket.connected) {
            fetchNotifications();
            connectSocket();
        }

        // Desconecta al cerrar sesión real
        const unsub = useAuthStore.subscribe(
            (state) => state.isAuthenticated,
            (auth) => {
                if (!auth) disconnectSocket();
            }
        );

        return () => unsub();
    }, [isAuthenticated]);

    return (
        <BrowserRouter basename="/">
            <IpcRouterBridge />

            <Routes>
                {/* 🟦 RUTAS PÚBLICAS */}
                <Route path="/" element={<SplashScreen />} />
                <Route path="/login" element={<LoginPage />} />

                {/* 🟢 RUTAS PRIVADAS */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <Dashboard />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <Settings />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/settings/users"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <UsersAndRoles />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/settings/departments"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <DepartmentList />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />

                {/* 👥 Usuarios */}
                <Route
                    path="/users"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <UserList />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />

                {/* 👩‍⚕️ Pacientes */}
                <Route
                    path="/patients"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <PatientList />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/patients/:id"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <PatientDetail />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                >
                    {/* REDIRECCIÓN DEFAULT A "Resumen" */}
                    <Route index element={<Navigate to="summary" replace />} />

                    <Route path="summary" element={<SummarySection />} />
                    <Route path="general" element={<GeneralSection />} />
                    <Route path="clinical" element={<ClinicalSection />} />
                    <Route path="family" element={<FamilySection />} />
                    <Route path="representative" element={<RepresentativesSection />} />
                    <Route path="alerts" element={<AlertsSection />} />

                    {/* Secciones extra */}
                    <Route path="billing" element={<BillingSection />} />
                    <Route path="appointments" element={<AppointmentsSection />} />
                    <Route path="prescriptions" element={<PrescriptionsSection />} />
                    <Route path="contracts" element={<ContractsSection />} />
                    <Route path="treatment-plan" element={<TreatmentPlanSection />} />
                    <Route path="budgets" element={<BudgetsSection />} />
                    <Route path="hobbies" element={<HobbiesSection />} />
                    <Route path="conversations" element={<ConversationsSection />} />
                    <Route path="notes" element={<NotesSection />} />
                    <Route path="gallery" element={<GallerySection />} />
                    <Route path="extraction-orders" element={<ExtractionOrdersSection />} />
                    <Route path="odontogram" element={<OdontogramSection />} />
                    <Route path="elastics" element={<ElasticsSection />} />
                    <Route path="account" element={<AccountSection />} />
                </Route>

                {/* 🏬 Tiendas */}
                <Route
                    path="/stores"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <StoreList />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/stores/:id"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <StoreDetail />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />

                {/* 💰 Cajas */}
                <Route
                    path="/cash-registers"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <CashRegisterList />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/cash-registers/:id"
                    element={
                        <PrivateRoute>
                            <PrivateLayout>
                                <CashRegisterDetail />
                            </PrivateLayout>
                        </PrivateRoute>
                    }
                />

                {/* 🚦 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* 🧱 Global Toasts */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </BrowserRouter>
    );
}

/* ──────────────────────────────────────────────
 🧱 LAYOUT PRIVADO
 Contiene el Header global persistente y el contenedor de las páginas.
────────────────────────────────────────────── */
function PrivateLayout({ children }) {
    const shortcuts = [
        { label: "IN", name: "Inicio", path: "/dashboard", bg: "#3b3b0a", color: "#facc15" },
        { label: "CP", name: "Control de pacientes", path: "/patients", bg: "#0f2d2d", color: "#10b981" },
        { label: "CA", name: "Calendario", path: "/calendar", bg: "#0a2a6b", color: "#3b82f6" },
        { label: "IN", name: "Inventarios", path: "/inventory", bg: "#3b0a3b", color: "#a855f7" },
        { label: "FA", name: "Facturación", path: "/billing", bg: "#422006", color: "#f59e0b" },
        { label: "EM", name: "Empleados", path: "/employees", bg: "#052e16", color: "#22c55e" },
        { label: "ES", name: "Estudio de fotos", path: "/photo-studio", bg: "#1e1b4b", color: "#6366f1" },
        { label: "CO", name: "Configuración", path: "/settings", bg: "#450a0a", color: "#ef4444" },
    ];

    return (
        <div className="min-h-screen flex bg-slate-100 text-slate-900 dark:bg-dark dark:text-slate-50">
            <QuickAccessBar
                items={shortcuts}
                onAdd={() => console.log("➕ Nuevo acceso directo")}
            />
            <div className="flex-1 flex flex-col ml-[60px] h-screen overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}



