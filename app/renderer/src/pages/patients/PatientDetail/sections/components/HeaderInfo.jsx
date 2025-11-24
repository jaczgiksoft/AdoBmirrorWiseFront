import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderInfo({ label, children }) {
    const [show, setShow] = useState(false);
    const valueRef = useRef(null);
    const [shouldShowTooltip, setShouldShowTooltip] = useState(true);

    const fullText = String(children);

    // Detectar si el texto está truncado
    useEffect(() => {
        if (valueRef.current) {
            const isTruncated =
                valueRef.current.scrollWidth > valueRef.current.clientWidth;

            setShouldShowTooltip(isTruncated);
        }
    }, [children]);

    return (
        <div
            className="
                relative
                bg-slate-50 dark:bg-dark/40
                p-3 rounded-xl
                border border-slate-200 dark:border-slate-700
                cursor-default select-none
            "
            onMouseEnter={() => shouldShowTooltip && setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {/* LABEL */}
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                {label}
            </p>

            {/* VALUE (TRUNCADO) */}
            <p
                ref={valueRef}
                className="
                    font-semibold mt-0.5
                    truncate overflow-hidden text-ellipsis whitespace-nowrap
                    max-w-full block
                "
            >
                {fullText}
            </p>

            {/* TOOLTIP */}
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="
                            absolute left-1/2 -translate-x-1/2
                            top-full mt-2 z-50
                            px-3 py-1.5 rounded-lg text-xs shadow-lg
                            whitespace-nowrap
                            bg-white dark:bg-slate-800
                            text-slate-700 dark:text-slate-200
                            border border-slate-200 dark:border-slate-700
                            backdrop-blur-sm
                        "
                    >
                        {fullText}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
