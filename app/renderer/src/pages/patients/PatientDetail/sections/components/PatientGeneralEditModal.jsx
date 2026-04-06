import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Datepicker from "react-tailwindcss-datepicker";
import { getReferrals } from "@/services/referral.service";
import { updatePatientGeneral } from "@/services/patient.service";
import { useToastStore } from "@/store/useToastStore";

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
    const [birthDatePicker, setBirthDatePicker] = useState({
        startDate: null,
        endDate: null,
    });

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
                photo_preview: profile.photo_url ? `${import.meta.env.VITE_API_BASE}/${profile.photo_url}` : null,
            });

            if (profile.birth_date) {
                setBirthDatePicker({
                    startDate: profile.birth_date,
                    endDate: profile.birth_date,
                });
            }
        }
    }, [open, profile]);

    // Fetch referrals
    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                const data = await getReferrals();
                setReferrals(data || []);
            } catch (err) {
                console.error("Error fetching referrals:", err);
            }
        };
        if (open) fetchReferrals();
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleBirthDateChange = (newValue) => {
        setBirthDatePicker(newValue);
        setForm(prev => ({ ...prev, birth_date: newValue.startDate }));
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
            const nullableFields = ["referral_id", "genre", "marital_status"];
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
        >
            <div className="flex flex-col gap-6">

                {/* SECCIÓN 1: IDENTIDAD */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                        🧩 Identidad y Expediente
                    </h3>

                    {/* FOTO */}
                    <div className="flex items-center gap-4">
                        <label className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition overflow-hidden shadow-sm">
                            {form.photo_preview ? (
                                <img src={form.photo_preview} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center">
                                    <Upload size={20} />
                                    <span className="text-[10px] mt-1 font-medium">Foto</span>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        </label>
                        <div className="text-xs text-slate-400 max-w-[200px]">
                            Haz clic en el recuadro para actualizar la foto del paciente.
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Número de expediente" required>
                            <input
                                name="medical_record_number"
                                value={form.medical_record_number || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej: 000123"
                            />
                        </InputGroup>
                        <InputGroup label="Código familiar">
                            <input
                                name="family_code"
                                value={form.family_code || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej: FAM-01"
                            />
                        </InputGroup>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <InputGroup label="Nombre" required>
                            <input
                                name="first_name"
                                value={form.first_name || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Nombre(s)"
                            />
                        </InputGroup>
                        <InputGroup label="Apellido paterno" required>
                            <input
                                name="last_name"
                                value={form.last_name || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Paterno"
                            />
                        </InputGroup>
                        <InputGroup label="Apellido materno">
                            <input
                                name="middle_name"
                                value={form.middle_name || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Materno"
                            />
                        </InputGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Apodo / Nickname">
                            <input
                                name="nickname"
                                value={form.nickname || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej: Juanito"
                            />
                        </InputGroup>
                        <InputGroup label="Género" required>
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
                        </InputGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Fecha de nacimiento" required>
                            <div className="relative">
                                <Datepicker
                                    value={birthDatePicker}
                                    onChange={handleBirthDateChange}
                                    useRange={false}
                                    asSingle={true}
                                    displayFormat={"YYYY-MM-DD"}
                                    placeholder="Seleccionar..."
                                    readOnly={true}
                                    i18n={"es"}
                                    maxDate={new Date()}
                                    inputClassName="input w-full"
                                    containerClassName="relative"
                                />
                                {form.birth_date && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                        {calculateAge(form.birth_date)}
                                    </span>
                                )}
                            </div>
                        </InputGroup>
                        <InputGroup label="Estado civil">
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
                        </InputGroup>
                    </div>
                </div>

                {/* SECCIÓN 2: CONTACTO */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                        📞 Contacto y Referencia
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Teléfono" required>
                            <input
                                name="phone_number"
                                value={form.phone_number || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="55-1234-5678"
                            />
                        </InputGroup>
                        <InputGroup label="Correo electrónico" required>
                            <input
                                name="email"
                                value={form.email || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="correo@ejemplo.com"
                            />
                        </InputGroup>
                    </div>
                    <InputGroup label="Referido por">
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
                    </InputGroup>
                </div>

                {/* SECCIÓN 3: DIRECCIÓN */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                        🏠 Dirección
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <InputGroup label="Calle">
                                <input
                                    name="address_street_name"
                                    value={form.address_street_name || ""}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Av. Reforma"
                                />
                            </InputGroup>
                        </div>
                        <InputGroup label="Número ext.">
                            <input
                                name="address_street_number"
                                value={form.address_street_number || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="123"
                            />
                        </InputGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Número int. / Depto.">
                            <input
                                name="address_apartment_number"
                                value={form.address_apartment_number || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="4B"
                            />
                        </InputGroup>
                        <InputGroup label="Colonia">
                            <input
                                name="address_neighborhood"
                                value={form.address_neighborhood || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Centro"
                            />
                        </InputGroup>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <InputGroup label="Código postal">
                            <input
                                name="address_zip_code"
                                value={form.address_zip_code || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="06000"
                            />
                        </InputGroup>
                        <InputGroup label="Ciudad">
                            <input
                                name="address_city"
                                value={form.address_city || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ciudad de México"
                            />
                        </InputGroup>
                        <InputGroup label="Estado">
                            <input
                                name="address_state"
                                value={form.address_state || ""}
                                onChange={handleChange}
                                className="input"
                                placeholder="CDMX"
                            />
                        </InputGroup>
                    </div>
                    <InputGroup label="País">
                        <input
                            name="address_country"
                            value={form.address_country || ""}
                            onChange={handleChange}
                            className="input"
                            placeholder="México"
                        />
                    </InputGroup>
                </div>

                {/* ACCIONES */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
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
            </div>
        </Modal>
    );
}

function InputGroup({ label, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className={`text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 ${required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}`}>
                {label}
            </label>
            {children}
        </div>
    );
}
