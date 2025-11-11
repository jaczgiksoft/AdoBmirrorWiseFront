// app/renderer/src/components/ui/ToastContainer.jsx
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, AlertTriangle, XCircle, X } from "lucide-react";

const icons = {
    success: <CheckCircle className="text-green-400" size={20} />,
    error: <XCircle className="text-red-400" size={20} />,
    warning: <AlertTriangle className="text-yellow-400" size={20} />,
    info: <Info className="text-blue-400" size={20} />,
};

export default function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed bottom-4 right-4 flex flex-col-reverse gap-3 z-[9999]">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.25 }}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg w-80
              bg-slate-800/95 border border-slate-700 text-slate-100
              ${toast.type === "success" && "border-green-500/60"}
              ${toast.type === "error" && "border-red-500/60"}
              ${toast.type === "warning" && "border-yellow-500/60"}
              ${toast.type === "info" && "border-blue-500/60"}
            `}
                    >
                        <div className="pt-[2px]">{icons[toast.type] || icons.info}</div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm leading-tight">
                                {toast.title || "Notificación"}
                            </p>
                            {toast.message && (
                                <p className="text-xs text-slate-400 mt-[2px]">
                                    {toast.message}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-200 transition p-[2px]"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
