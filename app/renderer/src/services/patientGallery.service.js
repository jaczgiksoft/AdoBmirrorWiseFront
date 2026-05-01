// app/renderer/src/services/patientGallery.service.js
import api from "./api";

const patientGalleryService = {
  /**
   * Obtiene todas las carpetas de la galería de un paciente.
   * @param {number|string} patientId 
   */
  getFolders: async (patientId) => {
    const response = await api.get(`/patient-gallery/patient/${patientId}?t=${Date.now()}`);
    return response.data;
  },

  /**
   * Crea una nueva colección y sube las fotos.
   * @param {FormData} formData 
   */
  createGallery: async (formData) => {
    // El interceptor de api.js manejará el Content-Type automáticamente al detectar FormData
    const response = await api.post("/patient-gallery", formData);
    return response.data;
  },

  /**
   * Sobrescribe una imagen existente en la galería.
   * @param {number|string} imageId 
   * @param {FormData} formData (debe contener el archivo en el campo 'photo')
   */
  updateImage: async (imageId, formData) => {
    const response = await api.post(`/patient-gallery/image/${imageId}/edit`, formData);
    return response.data;
  },
};

export default patientGalleryService;
