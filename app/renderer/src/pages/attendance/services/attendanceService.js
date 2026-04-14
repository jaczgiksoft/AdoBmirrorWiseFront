// app/renderer/src/pages/attendance/services/attendanceService.js
import api from "../../../services/api";

export const ATTENDANCE_STATUS = [
    { value: "present", label: "Presente" },
    { value: "late", label: "Retardo" },
    { value: "absent", label: "Falta" }
];

const attendanceService = {
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.employeeId) params.append('employeeId', filters.employeeId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await api.get(`/attendance?${params.toString()}`);
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/attendance/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/attendance', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/attendance/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/attendance/${id}`);
        return response.data;
    }
};

export default attendanceService;
