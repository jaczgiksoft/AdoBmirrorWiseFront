import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { User2, UserPlus, Phone, Mail, Edit2, Trash2 } from "lucide-react";
import PatientRepresentativeModal from "../../shared/PatientRepresentativeModal";
import * as repService from "@/services/patientRepresentative.service";
import { ConfirmDialog } from "@/components/feedback";
import { useToast } from "@/hooks/useToast";



export default function RepresentativesSection() {
    const { profile, refreshProfile } = useOutletContext();
    const { addToast } = useToast();
    const reps = profile.representatives || [];

    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [saving, setSaving] = useState(false);

    // Para eliminación
    const [deleteIndex, setDeleteIndex] = useState(null);

    const handleAdd = () => {
        setEditingIndex(null);
        setModalOpen(true);
    };

    const handleEdit = (index) => {
        setEditingIndex(index);
        setModalOpen(true);
    };

    const handleSave = async (rep) => {
        setSaving(true);
        try {
            if (editingIndex !== null) {
                // 🟡 ACTUALIZAR
                const existingRep = reps[editingIndex];
                await repService.updateRepresentative(existingRep.id, rep);
            } else {
                // 🟢 CREAR (y vincular automáticamente por el backend)
                await repService.createRepresentative({
                    ...rep,
                    patient_id: profile.id
                });
            }

            await refreshProfile();
            addToast({
                type: "success",
                message: editingIndex !== null
                    ? "Representante actualizado correctamente"
                    : "Representante agregado correctamente"
            });
            setModalOpen(false);
        } catch (e) {
            console.error("Error saving representative:", e);
            addToast({
                type: "error",
                message: "Error al guardar el representante"
            });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (deleteIndex === null) return;
        try {
            const repToDelete = reps[deleteIndex];
            await repService.deleteRepresentative(repToDelete.id);
            await refreshProfile();
            addToast({
                type: "success",
                message: "Representante eliminado correctamente"
            });
        } catch (e) {
            console.error("Error deleting representative:", e);
            addToast({
                type: "error",
                message: "Error al eliminar el representante"
            });
        } finally {
            setDeleteIndex(null);
        }
    };


    return (
        <div className="space-y-6">

            {/* ===================================================
                🔷 ENCABEZADO PREMIUM FUERA DEL SECTION
            =================================================== */}
            {/* ===================================================
                🔷 ENCABEZADO PREMIUM FUERA DEL SECTION
            =================================================== */}
            <div className="flex items-start justify-between w-full">

                {/* IZQUIERDA: barra + icono + Título + Subtítulo */}
                <div className="flex items-start gap-3">

                    {/* Barra vertical */}
                    <div className="h-12 w-1.5 bg-primary rounded-full mt-1.5"></div>

                    {/* Título + subtítulo */}
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <User2 size={28} className="text-primary" />
                            <h1 className="text-3xl font-bold text-primary">
                                Representantes
                            </h1>
                        </div>

                        {/* Subtítulo */}
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Contactos responsables asociados al paciente.
                        </p>
                    </div>
                </div>

                {/* DERECHA: Botón premium */}
                <button
                    onClick={handleAdd}
                    className="
            flex items-center gap-2
            px-4 py-2
            bg-primary/10 text-primary
            rounded-xl shadow-sm
            text-sm font-medium
            hover:bg-primary hover:text-white
            active:scale-[0.97]
            transition-all duration-150 cursor-pointer"
                >
                    <UserPlus size={16} />
                    Agregar representante
                </button>
            </div>


            {/* ===================================================
                🔷 CONTENIDO DENTRO DEL SECTION
            =================================================== */}

            {reps.length === 0 ? (
                <Section>
                    <div className="flex flex-col items-center text-center py-10">

                        {/* Ícono grande premium */}
                        <div className="
                w-16 h-16 rounded-full
                bg-primary/10 text-primary
                flex items-center justify-center
                shadow-inner mb-4
            ">
                            <User2 size={36} className="opacity-80" />
                        </div>

                        {/* Título pequeño elegante */}
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                            Sin representantes registrados
                        </h3>

                        {/* Descripción suave */}
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                            Este paciente aún no tiene representantes o contactos responsables asociados.
                            Puedes agregar uno usando el botón "<strong>Agregar representante</strong>".
                        </p>

                    </div>
                </Section>
            ) : (
                <Section>
                    <div
                        className="
                            grid gap-5
                            grid-cols-1
                            md:grid-cols-2
                            lg:grid-cols-3
                        "
                    >
                        {reps.map((r, idx) => (
                            <RepresentativeCard
                                key={r.id || idx}
                                rep={r}
                                onEdit={() => handleEdit(idx)}
                                onDelete={() => setDeleteIndex(idx)}
                            />
                        ))}
                    </div>
                </Section>
            )}

            <PatientRepresentativeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                representative={editingIndex !== null ? reps[editingIndex] : null}
                patientData={profile}
            />

            <ConfirmDialog
                open={deleteIndex !== null}
                title="Eliminar representante"
                message={`¿Estás seguro de que deseas eliminar a ${reps[deleteIndex]?.full_name}?`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteIndex(null)}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                confirmVariant="error"
            />

        </div>
    );
}

/* ============================================================
   🔷 TARJETA PREMIUM DE REPRESENTANTE
============================================================ */
function RepresentativeCard({ rep, onEdit, onDelete }) {

    const initials = rep.full_name
        .split(" ")
        .map(p => p.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2);

    return (
        <div
            className="
                group
                rounded-xl border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800
                shadow-sm p-4
                transition-all duration-200
                hover:shadow-md space-y-3
                relative
            "
        >

            {/* Acciones Absolutas */}
            <div className="
                absolute top-3 right-3
                flex items-center gap-1
                opacity-0 group-hover:opacity-100
                transition-all duration-200
                translate-y-1 group-hover:translate-y-0
            ">
                <button
                    onClick={onEdit}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-700"
                    title="Editar"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border border-slate-200 dark:border-slate-700"
                    title="Eliminar"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div
                    className="
                        w-12 h-12 rounded-full
                        bg-primary/10 text-primary
                        flex items-center justify-center
                        text-sm font-bold
                        shadow-inner
                    "
                >
                    {initials}
                </div>

                <div className="flex-1">
                    <p className="font-semibold text-sm">{rep.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {rep.relationship}
                    </p>
                </div>
            </div>

            <div className="space-y-1 text-sm">
                <InfoItem label="Teléfono" icon={Phone}>
                    {rep.phone || "—"}
                </InfoItem>

                <InfoItem label="Correo" icon={Mail}>
                    {rep.email || "—"}
                </InfoItem>

                <InfoItem label="Acceso">
                    {rep.can_login ? (
                        <span className="text-green-500 font-semibold">Sí</span>
                    ) : (
                        <span className="text-red-500 font-semibold">No</span>
                    )}
                </InfoItem>
            </div>
        </div>
    );
}

/* ============================================================
   🔷 COMPONENTES BASE (SECTION + INFOITEM)
============================================================ */

function Section({ children }) {
    return (
        <div className="
            bg-white dark:bg-secondary
            border border-slate-200 dark:border-slate-700
            rounded-2xl p-5 shadow-sm space-y-4
        ">
            {children}
        </div>
    );
}

function InfoItem({ label, icon: Icon, children }) {
    return (
        <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {Icon && <Icon size={12} className="opacity-60" />}
                {label}
            </p>
            <p className="font-medium text-[13px]">{children}</p>
        </div>
    );
}
