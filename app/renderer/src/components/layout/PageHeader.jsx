import { ArrowLeft } from "lucide-react";

export default function PageHeader({ title, subtitle, onBack }) {
    return (
        <div className="flex items-center gap-4">

            <button
                onClick={onBack}
                className="
                        p-2 rounded-lg border transition cursor-pointer
        bg-white dark:bg-secondary
        border-slate-200 dark:border-slate-700
        text-slate-500 dark:text-slate-400

        hover:bg-primary hover:text-white
        dark:hover:bg-white/10 dark:hover:text-white
                "
            >
                <ArrowLeft size={24} />
            </button>

            <div>
                <h1 className="text-3xl font-bold text-primary">
                    {title}
                </h1>

                <p className="text-slate-500 dark:text-slate-400">
                    {subtitle}
                </p>
            </div>

        </div>
    );
}
