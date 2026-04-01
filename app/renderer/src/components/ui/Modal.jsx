import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

/**
 * Reusable generic Modal component
 * 
 * @param {boolean} open - Whether the modal is visible
 * @param {function} onClose - Function to call when trying to close (X button or backdrop)
 * @param {string} title - Title displayed in the header
 * @param {node} children - Content of the modal
 * @param {string} widthClass - Tailwind class for width (default: w-[520px])
 * @param {boolean} closeOnBackdrop - Whether clicking outside closes the modal
 */
export default function Modal({
    open,
    onClose,
    title,
    children,
    widthClass = "w-[520px]",
    closeOnBackdrop = false,
}) {
    // Prevent scrolling on body when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (open && e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                if (onClose) onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (closeOnBackdrop && e.target === e.currentTarget && onClose) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`bg-white dark:bg-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-hidden ${widthClass} flex flex-col`}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
