import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function DetailHeader({
    title,
    onBack,
    backLabel = "Volver"
}) {
    return (
        <div className="
            flex justify-between items-center mb-5 pb-2
            border-b
            border-slate-200 dark:border-slate-700/50
        ">

            {/* ⬅️ Back */}
            <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onBack}
                className="
                    group flex items-center gap-1 text-sm
                    text-slate-500 dark:text-slate-400
                    hover:text-slate-800 dark:hover:text-white
                    transition cursor-pointer
                "
            >
                <ChevronLeft
                    size={16}
                    className="opacity-70 group-hover:opacity-100 transition"
                />

                <span className="relative">
                    {backLabel}
                    <span
                        className="
                            absolute left-0 -bottom-0.5 h-[1px] w-0
                            bg-primary
                            transition-all group-hover:w-full
                        "
                    />
                </span>
            </motion.button>

            {/* 🧾 Title */}
            <h2 className="
                text-lg font-semibold tracking-wide
                text-primary
            ">
                {title}
            </h2>
        </div>
    );
}
