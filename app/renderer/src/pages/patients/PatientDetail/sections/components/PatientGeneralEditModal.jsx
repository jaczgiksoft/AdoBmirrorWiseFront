import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import UniversalDatePicker from "@/components/inputs/UniversalDatePicker";
import dayjs from "dayjs";
import { getReferrals } from "@/services/referral.service";
import { getOccupations } from "@/services/occupation.service";
import { updatePatientGeneral } from "@/services/patient.service";
import { useToastStore } from "@/store/useToastStore";
import { API_BASE } from "@/utils/apiBase";
import { ConfirmDialog } from "@/components/feedback";

/**
 * Modal to edit general patient information.
 * 
 * @param {boolean} open - Whether the modal is open
 * @param {function} onClose - Function to close the modal
 * @param {object} profile - Current patient profile data
 * @param {function} refreshProfile - Function to refresh the patient profile data
 */
export default function PatientGeneralEditModal({ open, onClose, profile, refreshProfile }) {
    const { addToast } = useToastStore();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        middle_name: "",
        nickname: "",
        medical_record_number: "",
        family_code: "",
        genre: "",
        birth_date: "",
        marital_status: "",
        phone_number: "",
        email: "",
        referral_id: "",
        occupation_id: "",
        address_street_name: "",
        address_street_number: "",
        address_apartment_number: "",
        address_neighborhood: "",
        address_zip_code: "",
        address_city: "",
        address_state: "",
        address_country: "",
        photo_url: "",
        photo_preview: null,
    });

    const [referrals, setReferrals] = useState([]);
    const [occupations, setOccupations] = useState([]);
    const [confirmCancel, setConfirmCancel] = useState(false);

    // Populate form when profile or open state changes
    useEffect(() => {
        if (open && profile) {
            // Only pick keys that are useful for this form to avoid sending 
            // the entire profile object (with relations) back to the server
            const baseForm = {
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                middle_name: profile.middle_name || "",
                nickname: profile.nickname || "",
                medical_record_number: profile.medical_record_number || "",
                family_code: profile.family_code || "",
                genre: profile.genre || "",
                birth_date: profile.birth_date || "",
                marital_status: profile.marital_status || "",
                phone_number: profile.phone_number || "",
                email: profile.email || "",
                referral_id: profile.referral_id || "",
                occupation_id: profile.occupation_id || "",
                address_street_name: profile.address_street_name || "",
                address_street_number: profile.address_street_number || "",
                address_apartment_number: profile.address_apartment_number || "",
                address_neighborhood: profile.address_neighborhood || "",
                address_zip_code: profile.address_zip_code || "",
                address_city: profile.address_city || "",
                address_state: profile.address_state || "",
                address_country: profile.address_country || "",
            };

            setForm({
                ...baseForm,
                photo_preview: profile.photo_url ? `${API_BASE}/${profile.photo_url}` : null,
            });
        }
    }, [open, profile]);

    // Fetch referrals and occupations
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [referralData, occupationData] = await Promise.all([
                    getReferrals(),
                    getOccupations()
                ]);
                setReferrals(referralData || []);
                setOccupations(occupationData || []);
            } catch (err) {
                console.error("Error fetching dependencies:", err);
            }
        };
        if (open) fetchData();
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleBirthDateChange = (newValue) => {
        setForm(prev => ({ ...prev, birth_date: newValue }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({
                    ...prev,
                    photo_file: file,
                    photo_preview: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return "";
        const today = new Date();
        const dob = new Date(birthDate);
        let years = today.getFullYear() - dob.getFullYear();
        let months = today.getMonth() - dob.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }
        if (years < 0) return "";
        return `${years} años${months > 0 ? `, ${months} meses` : ""}`;
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Clean payload: Convert empty strings to null for nullable/numeric fields
            // specifically for those that are managed as IDs or from Selects
            const payload = { ...form };

            // Fields that should be null if empty (FKs, specific selects)
            const nullableFields = ["referral_id", "occupation_id", "genre", "marital_status"];
            nullableFields.forEach(field => {
                if (payload[field] === "") {
                    payload[field] = null;
                }
            });

            await updatePatientGeneral(profile.id, payload);

            addToast({
                type: "success",
                title: "Paciente actualizado",
                message: "La información general se ha guardado correctamente.",
            });

            if (refreshProfile) await refreshProfile();
            onClose();
        } catch (err) {
            console.error("Error updating patient:", err);
            addToast({
                type: "error",
                title: "Error al actualizar",
                message: err.message || "No se pudo actualizar la información.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Editar Información General"
            widthClass="w-[800px]"
            footer={
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={() => setConfirmCancel(true)}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-5">

                {/* SECCIÓN 1: IDENTIDAD */}
                <div className="flex flex-col gap-5">
                    <h3 className="text-primary font-semibold text-sm">
                        🧩 PASO 1 — Identidad y Expediente
                    </h3>

                    {/* FOTO */}
                    <div className="flex items-center gap-4">
                        <label className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition overflow-hidden">
                            {form.photo_preview ? (
                                <img src={form.photo_preview} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center">
                                    <Upload size={20} />
                                    <span className="text-xs mt-1">Foto</span>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        </label>
                        <div className="text-xs text-slate-400">
                            Selecciona la foto del paciente (opcional)
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1 label-required">Número de expediente</label>
                            <input
                                name="medical_record_number"
                                value={form.medical_record_number || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej: 000123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Código familiar</label>
                            <input
                                name="family_code"
                                value={form.family_code || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej: FAM-01"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1 label-required">Nombre</label>
                            <input
                                name="first_name"
                                value={form.first_name || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Nombre(s)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 label-required">Apellido paterno</label>
                            <input
                                name="last_name"
                                value={form.last_name || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Paterno"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1">Apellido materno</label>
                            <input
                                name="middle_name"
                                value={form.middle_name || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Materno"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Apodo / Nickname</label>
                            <input
                                name="nickname"
                                value={form.nickname || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej: Juanito"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1 label-required">Género</label>
                            <select
                                name="genre"
                                value={form.genre || ""}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="male">Masculino</option>
                                <option value="female">Femenino</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>

                        <div className="flex flex-col relative z-[50]">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm label-required">Fecha de nacimiento</label>
                                {form.birth_date && (
                                    <span className="text-xs text-primary font-medium">
                                        {calculateAge(form.birth_date)}
                                    </span>
                                )}
                            </div>
                            <UniversalDatePicker
                                value={form.birth_date}
                                onChange={handleBirthDateChange}
                                maxDate={new Date()}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Estado civil</label>
                        <select
                            name="marital_status"
                            value={form.marital_status || ""}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="soltero">Soltero/a</option>
                            <option value="casado">Casado/a</option>
                            <option value="divorciado">Divorciado/a</option>
                            <option value="viudo">Viudo/a</option>
                            <option value="union libre">Unión libre</option>
                        </select>
                    </div>
                </div>

                {/* SECCIÓN 2: CONTACTO */}
                <div className="flex flex-col gap-5 mt-4">
                    <h3 className="text-primary font-semibold text-sm">
                        📞 PASO 2 — Contacto y Referencia
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1 label-required">Teléfono</label>
                            <input
                                name="phone_number"
                                value={form.phone_number || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="55-1234-5678"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 label-required">Correo electrónico</label>
                            <input
                                name="email"
                                value={form.email || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1">Referido por</label>
                            <select
                                name="referral_id"
                                value={form.referral_id || ""}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">Sin referidor</option>
                                {referrals.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Ocupación</label>
                            <select
                                name="occupation_id"
                                value={form.occupation_id || ""}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">Sin ocupación</option>
                                {occupations.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 3: DIRECCIÓN */}
                <div className="flex flex-col gap-5 mt-4">
                    <h3 className="text-primary font-semibold text-sm">
                        🏠 PASO 3 — Dirección
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1">Calle</label>
                            <input
                                name="address_street_name"
                                value={form.address_street_name || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Av. Reforma"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Número exterior</label>
                            <input
                                name="address_street_number"
                                value={form.address_street_number || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="123"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1">Número interior / Depto.</label>
                            <input
                                name="address_apartment_number"
                                value={form.address_apartment_number || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="4B"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Colonia</label>
                            <input
                                name="address_neighborhood"
                                value={form.address_neighborhood || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Centro"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1">Código postal</label>
                            <input
                                name="address_zip_code"
                                value={form.address_zip_code || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="06000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Ciudad</label>
                            <input
                                name="address_city"
                                value={form.address_city || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ciudad de México"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm mb-1">Estado</label>
                            <input
                                name="address_state"
                                value={form.address_state || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="CDMX"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">País</label>
                            <input
                                name="address_country"
                                value={form.address_country || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="México"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* CONFIRM EXIT */}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancelar"
                message="¿Deseas salir sin guardar los cambios?"
                onConfirm={onClose}
                onCancel={() => setConfirmCancel(false)}
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                confirmVariant="error"
            />
        </Modal>
    );
}
