import { useState } from "react";
import { useToastStore } from "../store/useToastStore";
import { linkOrCreateBillingData, updateLinkOrCreateBillingData, removeBillingFromPatient } from "../services/patientBillingData.service";

export function usePatientBillingData(patientId, onSuccess) {
    const { addToast } = useToastStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const saveBillingData = async (formData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                patient_id: parseInt(patientId),
                ...formData
            };
            
            if (formData.PatientBillingData && formData.PatientBillingData.id) {
                await updateLinkOrCreateBillingData(formData.PatientBillingData.id, payload);
                addToast({
                    title: "Éxito",
                    message: "Datos fiscales actualizados correctamente.",
                    type: "success"
                });
            } else {
                await linkOrCreateBillingData(payload);
                addToast({
                    title: "Éxito",
                    message: "Datos fiscales guardados y vinculados correctamente.",
                    type: "success"
                });
            }

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error al guardar datos fiscales:", error);
            
            const responseData = error?.response?.data || {};
            let errorMsg = responseData.message || "Ocurrió un error al guardar los datos fiscales.";

            if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
                errorMsg = responseData.errors[0].message;
            }

            addToast({
                title: "Error",
                message: errorMsg,
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteBillingData = async (relationId) => {
        try {
            await removeBillingFromPatient(relationId);
            addToast({
                title: "Éxito",
                message: "Dato fiscal eliminado correctamente.",
                type: "success"
            });
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error al eliminar dato fiscal:", error);
            addToast({
                title: "Error",
                message: "No se pudo eliminar el dato fiscal.",
                type: "error"
            });
        }
    };

    return {
        saveBillingData,
        deleteBillingData,
        isSubmitting
    };
}
