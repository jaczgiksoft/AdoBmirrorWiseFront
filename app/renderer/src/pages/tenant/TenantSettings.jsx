import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Save, Building2, Globe, FileText, MapPin, ChevronLeft, Calendar, DollarSign, Percent, ShieldCheck, Mail, Phone, Info } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { useHotkeys } from "@/hooks/useHotkeys";

const STORAGE_KEY = "bwise_tenant_config";

const INITIAL_TENANT_DATA = {
    // Identidad
    name: "Clínica Dental Sonrisa Feliz",
    description: "Clínica dental integral con servicios de ortodoncia, endodoncia y odontopediatría.",
    logo_url: "https://placehold.co/600x600/2ECC71/white?text=SONRISA",
    website: "https://sonrisafeliz.mx",
    specialties: ["Ortodoncia", "Endodoncia", "Odontopediatría"],
    health_registration: "COFEPRIS-DF-2025-01234",
    health_registration_expires_at: "2026-12-31",

    // Regional y Financiera
    timezone: "America/Hermosillo",
    currency: "MXN",
    exchange_rate: "17.50",
    tax_rate: "16.00",
    profit_margin: "30.00",

    // Legal y Fiscal
    legal_name: "Sonrisa Feliz S.A. de C.V.",
    tax_id: "SFL920315ABC",
    regime: "Régimen Simplificado de Confianza",
    cfdi_use: "G03 - Gastos en general",
    payment_method: "PUE - Pago en una sola exhibición",
    payment_form: "03 - Transferencia electrónica de fondos",
    certificate_path: "",
    key_path: "",
    certificate_password: "",

    // Contacto y Ubicación
    contact_name: "Dra. Laura Gómez",
    contact_email: "contacto@sonrisafeliz.mx",
    contact_phone: "+52 55 1234 5678",
    address: "Av. Universidad 245, Col. Narvarte",
    city: "Ciudad de México",
    state: "CDMX",
    country: "México",
    postal_code: "03020"
};

export default function TenantSettings() {
    const navigate = useNavigate();
    const { addToast } = useToastStore();
    const [form, setForm] = useState(INITIAL_TENANT_DATA);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setForm(JSON.parse(stored));
        }
        document.title = "Configuración de Clínica | BWISE";
    }, []);

    // 🎹 Shortcuts
    useHotkeys({
        "ctrl+s": (e) => { e.preventDefault(); handleSave(); },
        "escape": () => navigate("/settings", { state: { from: "/settings/tenant" } })
    }, [form]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSave = async () => {
        if (saving) return;

        // Validaciones básicas
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "El nombre comercial es obligatorio";
        if (form.health_registration && !form.health_registration_expires_at) {
            newErrors.health_registration_expires_at = "La fecha de expiración es necesaria si hay registro de salud";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            addToast({ type: "warning", title: "Campos pendientes", message: "Por favor revisa la información obligatoria." });
            return;
        }

        setSaving(true);
        try {
            // Simular API
            await new Promise(resolve => setTimeout(resolve, 800));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
            addToast({ type: "success", title: "Configuración guardada", message: "La información de la clínica se actualizó correctamente." });
        } catch (error) {
            addToast({ type: "error", title: "Error", message: "No se pudo guardar la configuración." });
        } finally {
            setSaving(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title, subtitle }) => (
        <div className="flex items-start gap-4 mb-6 pt-4 first:pt-0">
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-xl text-primary">
                <Icon size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-dark flex flex-col font-sans text-slate-900 dark:text-slate-50 h-full overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-6xl mx-auto px-6 py-10"
            >
                {/* 🔙 Cabecera */}
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/settings", { state: { from: "/settings/tenant" } })}
                            className="p-2 hover:bg-white dark:hover:bg-secondary rounded-lg transition text-slate-500 hover:text-primary"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-primary tracking-tight">Configuración de Clínica</h1>
                            <p className="text-slate-500 text-sm mt-1">Personaliza la identidad y parámetros globales de tu consultorio.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-sky-500 transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
                    >
                        <Save size={20} />
                        <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* SECCIÓN 1: IDENTIDAD */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-secondary/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <SectionHeader
                                icon={Building2}
                                title="Información de Identidad"
                                subtitle="Define cómo los pacientes y el sistema ven tu marca."
                            />
                            <div className="grid gap-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="label-form label-required">Nombre comercial</label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className={`input w-full ${errors.name ? 'border-error' : ''}`}
                                            placeholder="Nombre de la clínica"
                                        />
                                        {errors.name && <span className="text-xs text-error mt-1">{errors.name}</span>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="label-form">Reseña / Descripción</label>
                                        <textarea
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            rows={2}
                                            className="input w-full resize-none"
                                            placeholder="Una breve descripción opcional..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="label-form">URL del Logo</label>
                                        <input
                                            name="logo_url"
                                            value={form.logo_url}
                                            onChange={handleChange}
                                            className="input w-full font-mono text-xs"
                                            placeholder="https://clinkia.com/logo.png"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-form">Sitio Web</label>
                                        <input
                                            name="website"
                                            value={form.website}
                                            onChange={handleChange}
                                            className="input w-full"
                                            placeholder="www.clinica.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-form">Especialidades (Separado por comas)</label>
                                        <input
                                            name="specialties"
                                            value={Array.isArray(form.specialties) ? form.specialties.join(", ") : form.specialties}
                                            onChange={(e) => setForm(f => ({ ...f, specialties: e.target.value.split(",").map(s => s.trim()) }))}
                                            className="input w-full"
                                            placeholder="Ortodoncia, Cirugía..."
                                        />
                                    </div>
                                    <div>
                                        <label className="label-form">Registro de Salud</label>
                                        <input
                                            name="health_registration"
                                            value={form.health_registration}
                                            onChange={handleChange}
                                            className="input w-full font-bold"
                                            placeholder="ID-AUTORIDAD"
                                        />
                                    </div>
                                    <div>
                                        <label className={`label-form ${form.health_registration ? 'label-required' : ''}`}>Expiración de Registro</label>
                                        <div className="relative">
                                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="date"
                                                name="health_registration_expires_at"
                                                value={form.health_registration_expires_at?.split("T")[0]}
                                                onChange={handleChange}
                                                className={`input w-full pl-10 ${errors.health_registration_expires_at ? 'border-error' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: REGIONAL Y FINANCIERA */}
                        <div className="bg-white dark:bg-secondary/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <SectionHeader
                                icon={Globe}
                                title="Regional y Financiera"
                                subtitle="Configura la zona horaria, moneda e impuestos base."
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="label-form">Zona Horaria (Agenda)</label>
                                    <select
                                        name="timezone"
                                        value={form.timezone}
                                        onChange={handleChange}
                                        className="input w-full appearance-none bg-white dark:bg-secondary"
                                    >
                                        <option value="America/Hermosillo">America/Hermosillo (MST)</option>
                                        <option value="America/Mexico_City">America/Mexico_City (CST)</option>
                                        <option value="America/New_York">America/New_York (EST)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-form flex items-center gap-2">
                                        <DollarSign size={14} /> Moneda Local
                                    </label>
                                    <select
                                        name="currency"
                                        value={form.currency}
                                        onChange={handleChange}
                                        className="input w-full"
                                    >
                                        <option value="MXN">MXN - Peso Mexicano</option>
                                        <option value="USD">USD - Dólar Estadounidense</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-form">Tipo de Cambio</label>
                                    <input
                                        type="number" step="0.01"
                                        name="exchange_rate"
                                        value={form.exchange_rate}
                                        onChange={handleChange}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="label-form flex items-center gap-2">
                                        <Percent size={14} /> Impuesto (IVA) %
                                    </label>
                                    <input
                                        type="number"
                                        name="tax_rate"
                                        value={form.tax_rate}
                                        onChange={handleChange}
                                        className="input w-full text-primary font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="label-form">Margen de Ganancia %</label>
                                    <input
                                        type="number"
                                        name="profit_margin"
                                        value={form.profit_margin}
                                        onChange={handleChange}
                                        className="input w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* SECCIÓN 3: LEGAL Y FISCAL */}
                        <div className="bg-white dark:bg-secondary/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <SectionHeader
                                icon={FileText}
                                title="Información Legal y Fiscal"
                                subtitle="Datos necesarios para la facturación electrónica y cumplimiento legal."
                            />
                            <div className="grid gap-5">
                                <div>
                                    <label className="label-form">Razón Social (Nombre Legal)</label>
                                    <input
                                        name="legal_name"
                                        value={form.legal_name}
                                        onChange={handleChange}
                                        className="input w-full"
                                        placeholder="Sonrisa Feliz S.A. de C.V."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-form tracking-widest text-[10px]">ID FISCAL (RFC)</label>
                                        <input
                                            name="tax_id"
                                            value={form.tax_id}
                                            onChange={handleChange}
                                            className="input w-full uppercase font-mono font-bold"
                                            placeholder="XAXX010101000"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-form">Régimen Fiscal</label>
                                        <input
                                            name="regime"
                                            value={form.regime}
                                            onChange={handleChange}
                                            className="input w-full text-xs"
                                            placeholder="Ej. PF con Actividad Empresarial"
                                        />
                                    </div>
                                </div>

                                <label className="text-[11px] font-bold text-slate-400 mt-2 uppercase flex items-center gap-2">
                                    <ShieldCheck size={12} /> Sellos Digitales (CSD)
                                </label>
                                <div className="grid grid-cols-1 gap-3 bg-slate-50 dark:bg-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input name="certificate_path" value={form.certificate_path} onChange={handleChange} className="input text-[10px] w-full" placeholder="Ruta .CER" />
                                        <input name="key_path" value={form.key_path} onChange={handleChange} className="input text-[10px] w-full" placeholder="Ruta .KEY" />
                                    </div>
                                    <input type="password" name="certificate_password" value={form.certificate_password} onChange={handleChange} className="input w-full" placeholder="Contraseña de sellos" />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                                    <div>
                                        <label className="label-form">Uso de CFDI por defecto</label>
                                        <input name="cfdi_use" value={form.cfdi_use} onChange={handleChange} className="input w-full text-xs" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label-form">Método de Pago</label>
                                            <input name="payment_method" value={form.payment_method} onChange={handleChange} className="input w-full text-xs" />
                                        </div>
                                        <div>
                                            <label className="label-form">Forma de Pago</label>
                                            <input name="payment_form" value={form.payment_form} onChange={handleChange} className="input w-full text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 4: CONTACTO Y UBICACIÓN */}
                        <div className="bg-white dark:bg-secondary/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <SectionHeader
                                icon={MapPin}
                                title="Contacto y Ubicación"
                                subtitle="Datos de la persona responsable y localización de la clínica."
                            />
                            <div className="grid gap-5">
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
                                    <p className="text-[10px] uppercase font-bold text-primary flex items-center gap-1 mb-3">
                                        <Info size={10} /> Persona Responsable
                                    </p>
                                    <div className="grid gap-3">
                                        <input name="contact_name" value={form.contact_name} onChange={handleChange} className="input w-full" placeholder="Nombre completo" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input name="contact_email" value={form.contact_email} onChange={handleChange} className="input w-full pl-10 text-xs" placeholder="email@contacto.com" />
                                            </div>
                                            <div className="relative">
                                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input name="contact_phone" value={form.contact_phone} onChange={handleChange} className="input w-full pl-10" placeholder="+52..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="label-form">Dirección Física</label>
                                    <input name="address" value={form.address} onChange={handleChange} className="input w-full" placeholder="Calle, Número, Colonia" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input name="city" value={form.city} onChange={handleChange} className="input w-full" placeholder="Ciudad" />
                                    <input name="state" value={form.state} onChange={handleChange} className="input w-full" placeholder="Estado" />
                                    <input name="country" value={form.country} onChange={handleChange} className="input w-full" placeholder="País" />
                                    <input name="postal_code" value={form.postal_code} onChange={handleChange} className="input w-full" placeholder="Código Postal" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            </motion.div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .label-form {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    margin-bottom: 0.4rem;
                    color: rgb(100 116 139);
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .label-required::after {
                    content: " *";
                    color: #ef4444;
                }
                .dark .label-form {
                    color: rgb(148 163 184);
                }
            `}} />
        </div>
    );
}
