// app/renderer/src/pages/attendance/services/attendanceService.js

export const ATTENDANCE_TYPES = [
    "Entrada",
    "Salida",
    "Salida de comida",
    "Entrada de comida"
];

export const LATENESS_OPTIONS = [
    { value: "all", label: "Todos" },
    { value: "late", label: "Con retardo" },
    { value: "on_time", label: "A tiempo" }
];

export const INITIAL_ATTENDANCE_DATA = [
    {
        id: 1,
        employeeId: 1,
        employeeName: "Adolfo Castro García",
        type: "Entrada",
        dateTime: new Date(new Date().setHours(8, 5, 0)).toISOString(),
        isLate: true,
        notes: "Tráfico pesado en la zona norte"
    },
    {
        id: 2,
        employeeId: 2,
        employeeName: "Ana López Pérez",
        type: "Entrada",
        dateTime: new Date(new Date().setHours(7, 55, 0)).toISOString(),
        isLate: false,
        notes: ""
    },
    {
        id: 3,
        employeeId: 1,
        employeeName: "Adolfo Castro García",
        type: "Salida de comida",
        dateTime: new Date(new Date().setHours(14, 0, 0)).toISOString(),
        isLate: false,
        notes: ""
    }
];
