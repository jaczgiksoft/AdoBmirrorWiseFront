import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Phone,
    Calendar,
    CheckCircle,
    X,
    Delete,
    User,
    Clock,
    ArrowRight,
    Search,
    Trash2,
    Loader2
} from "lucide-react";
import { findKioskAppointments } from "../../services/appointment.service";

export default function ConfirmationKiosk() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Keypad, 2: Selection, 3: Confirmation
    const [phoneNumber, setPhoneNumber] = useState("");
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointments, setSelectedAppointments] = useState([]);
    const [tenant, setTenant] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // 🔒 Validar sesión de Kiosko
    useEffect(() => {
        const storedTenant = localStorage.getItem("verifiedTenant");
        if (!storedTenant) {
            console.warn("⚠️ No hay código de cliente verificado. Redirigiendo a Login...");
            navigate("/login");
            return;
        }
        setTenant(JSON.parse(storedTenant));
    }, [navigate]);

    const handleNumberClick = (num) => {
        setError(null);
        if (phoneNumber.length < 10) {
            setPhoneNumber(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setError(null);
        setPhoneNumber(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setError(null);
        setPhoneNumber("");
    };

    const handleEnter = async () => {
        if (phoneNumber.length >= 7) {
            setIsLoading(true);
            setError(null);
            try {
                const data = await findKioskAppointments(phoneNumber);
                if (data && data.length > 0) {
                    setAppointments(data);
                    setStep(2);
                } else {
                    setError("No se encontraron citas pendientes para este número.");
                }
            } catch (err) {
                console.error("Error al buscar citas:", err);
                setError("Ocurrió un error al buscar tus citas. Por favor intenta de nuevo.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const toggleSelection = (id) => {
        setSelectedAppointments(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleConfirmSelection = () => {
        if (selectedAppointments.length > 0) {
            setStep(3);
        }
    };

    const resetKiosk = () => {
        setStep(1);
        setPhoneNumber("");
        setAppointments([]);
        setSelectedAppointments([]);
        setError(null);
    };

    return (
        <div className="h-screen w-screen bg-slate-900 flex items-center justify-center font-sans overflow-hidden text-slate-100">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="keypad"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white/10 w-[420px]"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-white mb-2">Auto-Confirmación</h2>
                            <p className="text-slate-400">Ingresa tu número de teléfono</p>
                        </div>

                        <div className="bg-slate-900/50 p-6 rounded-3xl mb-8 border border-white/5 text-center">
                            <span className="text-4xl font-mono tracking-widest text-sky-400 h-10 block">
                                {phoneNumber || <span className="text-slate-700">_ _ _ _ _ _ _ _ _ _</span>}
                            </span>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-sm text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <KeypadButton key={num} label={num} onClick={() => handleNumberClick(num.toString())} />
                            ))}
                            <KeypadButton
                                label={<Trash2 size={24} className="text-red-400" />}
                                onClick={handleClear}
                                className="bg-red-500/10 hover:bg-red-500/20 border-red-500/20"
                            />
                            <KeypadButton label="0" onClick={() => handleNumberClick("0")} />
                            <KeypadButton
                                label={<Delete size={28} />}
                                onClick={handleDelete}
                                className="bg-slate-700/50 text-slate-400"
                            />
                            <button
                                onClick={handleEnter}
                                disabled={phoneNumber.length < 7 || isLoading}
                                className="col-span-3 mt-4 py-6 rounded-3xl bg-sky-500 hover:bg-sky-400 text-white text-2xl font-black shadow-lg shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={28} />
                                        BUSCANDO...
                                    </>
                                ) : (
                                    "CONTINUAR"
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}
                        className="bg-slate-800/80 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-white/10 w-[600px]"
                    >
                        <div className="mb-8">
                            <h2 className="text-4xl font-black text-white mb-2">Selecciona tu cita</h2>
                            <p className="text-slate-400">Hemos encontrado estas citas para ti</p>
                        </div>

                        <div className="space-y-4 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {appointments.map(appt => (
                                <motion.div
                                    key={appt.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleSelection(appt.id)}
                                    className={`
                                        p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between
                                        ${selectedAppointments.includes(appt.id)
                                            ? 'bg-sky-500/20 border-sky-500 shadow-lg shadow-sky-500/10'
                                            : 'bg-slate-900/50 border-white/5 hover:border-white/20'}
                                    `}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-2xl ${selectedAppointments.includes(appt.id) ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-white">{appt.patient}</p>
                                            <p className="text-sm text-slate-400 font-medium">{appt.doctor} • {new Date(appt.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2 text-sky-400 font-black text-xl">
                                            <Clock size={20} />
                                            {appt.time}
                                        </div>
                                        {selectedAppointments.includes(appt.id) && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500 mt-1 block">Seleccionado</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-5 rounded-3xl bg-slate-700/50 text-slate-300 font-bold hover:bg-slate-700 transition-all"
                            >
                                VOLVER
                            </button>
                            <button
                                onClick={handleConfirmSelection}
                                disabled={selectedAppointments.length === 0}
                                className="flex-[2] py-5 rounded-3xl bg-sky-500 text-white font-black hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
                            >
                                CONFIRMAR LLEGADA
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="confirmation"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                        className="bg-slate-800/80 backdrop-blur-xl p-12 rounded-[50px] shadow-2xl border border-white/10 w-[500px] text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                            className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30"
                        >
                            <CheckCircle size={64} className="text-white" />
                        </motion.div>

                        <h2 className="text-5xl font-black text-white mb-4">¡Cita Confirmada!</h2>
                        <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                            Gracias por confirmar tu llegada. Por favor, toma asiento, te llamaremos en un momento.
                        </p>

                        <button
                            onClick={resetKiosk}
                            className="w-full py-6 rounded-[28px] bg-white text-slate-900 text-2xl font-black hover:bg-slate-100 transition-all active:scale-95"
                        >
                            FINALIZAR
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function KeypadButton({ label, onClick, className = "" }) {
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClick}
            className={`
                h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-all
                ${className || 'bg-slate-700/30 text-white hover:bg-slate-700/50 border border-white/5'}
            `}
        >
            {label}
        </motion.button>
    );
}
