import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { getEmployees } from '@/services/employee.service';
import { getAllServices } from '@/services/service.service';

/**
 * Hook para gestionar el desempeño clínico con datos de la API y simulación de citas.
 */
export const useClinicalPerformance = (filters) => {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [services, setServices] = useState([]);
    const [appointments, setAppointments] = useState([]);

    // Cargar datos base de la API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [empRes, servRes] = await Promise.all([
                    getEmployees(),
                    getAllServices()
                ]);

                // Ajustar según estructura de respuesta del backend bwise
                const empList = Array.isArray(empRes) ? empRes : (empRes.data || []);
                const servList = Array.isArray(servRes) ? servRes : (servRes.data || []);

                setEmployees(empList);
                setServices(servList);

                // Una vez cargados los reales, generar la simulación
                generateMockAppointments(empList, servList);
            } catch (error) {
                console.error("Error loading performance data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Generador de datos mock equitativos
    const generateMockAppointments = (empList, servList) => {
        if (!empList.length || !servList.length) return;

        const mockData = [];
        const TOTAL_DAYS = 30;
        const startDate = dayjs().subtract(TOTAL_DAYS, 'day');

        // Para cada empleado y servicio, asegurar citas para que no se vea vacío
        empList.forEach((emp) => {
            // Generar entre 15 y 25 citas por empleado para representatividad
            const count = Math.floor(Math.random() * 10) + 15;
            
            for (let i = 0; i < count; i++) {
                const randomDay = Math.floor(Math.random() * TOTAL_DAYS);
                const randomService = servList[Math.floor(Math.random() * servList.length)];
                
                // Probabilidad de 80% "Bien", 20% "Retraso" (simulando buen personal)
                const isGood = Math.random() > 0.2;
                
                mockData.push({
                    id: `${emp.id}-${i}`,
                    date: startDate.add(randomDay, 'day').format('YYYY-MM-DD'),
                    idDoctor: emp.id,
                    doctorName: emp.name || `${emp.first_name} ${emp.last_name}`,
                    idServicio: randomService.id,
                    serviceName: randomService.name,
                    status: isGood ? 'Bien' : 'Retraso',
                    attentionTime: isGood 
                        ? (randomService.duration_minutes || 30) - (Math.random() * 5)
                        : (randomService.duration_minutes || 30) + (Math.random() * 15),
                });
            }
        });

        setAppointments(mockData);
    };

    // Procesar datos basados en filtros
    const dashboardData = useMemo(() => {
        if (loading || !appointments.length) return null;

        let filtered = appointments.filter(app => {
            const matchDate = filters.startDate && filters.endDate
                ? dayjs(app.date).isAfter(dayjs(filters.startDate).subtract(1, 'day')) && 
                  dayjs(app.date).isBefore(dayjs(filters.endDate).add(1, 'day'))
                : true;
            
            const matchDoctor = filters.doctorId === "all" || app.idDoctor.toString() === filters.doctorId.toString();
            const matchService = filters.serviceId === "all" || app.idServicio.toString() === filters.serviceId.toString();

            return matchDate && matchDoctor && matchService;
        });

        // KPIs
        const total = filtered.length;
        const success = filtered.filter(a => a.status === 'Bien').length;
        const delays = total - success;
        const successRate = total > 0 ? (success / total) * 100 : 0;

        // Doctor del Mes (Top Performer)
        const doctorStats = {};
        filtered.forEach(app => {
            if (!doctorStats[app.idDoctor]) doctorStats[app.idDoctor] = { name: app.doctorName, good: 0, total: 0 };
            doctorStats[app.idDoctor].total++;
            if (app.status === 'Bien') doctorStats[app.idDoctor].good++;
        });

        const topDoctor = Object.values(doctorStats).sort((a, b) => (b.good / b.total) - (a.good / a.total))[0];

        // Chart 1: Bar Chart (Desempeño por empleado)
        const barData = Object.values(doctorStats).map(d => ({
            name: d.name.split(' ')[0], // Solo el primer nombre para legibilidad
            Bien: d.good,
            Retraso: d.total - d.good
        }));

        // Chart 2: Evolution (Área)
        const evolutionRaw = {};
        filtered.forEach(app => {
            const day = app.date;
            if (!evolutionRaw[day]) evolutionRaw[day] = { date: day, total: 0, good: 0 };
            evolutionRaw[day].total++;
            if (app.status === 'Bien') evolutionRaw[day].good++;
        });
        const areaData = Object.values(evolutionRaw)
            .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
            .map(d => ({
                date: dayjs(d.date).format('DD MMM'),
                rate: Math.round((d.good / d.total) * 100)
            }));

        // Chart 3: Pie Chart (Servicios más realizados por el mejor doctor)
        let pieData = [];
        if (topDoctor) {
            const bestDoctorApps = filtered.filter(a => a.idDoctor.toString() === Object.keys(doctorStats).find(id => doctorStats[id].name === topDoctor.name));
            const serviceCounts = {};
            bestDoctorApps.forEach(a => {
                serviceCounts[a.serviceName] = (serviceCounts[a.serviceName] || 0) + 1;
            });
            pieData = Object.entries(serviceCounts).map(([name, value]) => ({ name, value })).slice(0, 5);
        }

        return {
            kpis: {
                successRate: Math.round(successRate),
                totalDelays: delays,
                topDoctor: topDoctor?.name || "N/A",
                comparison: 12 // Valor mock para comparativa vs mes anterior
            },
            charts: {
                barData,
                areaData,
                pieData
            }
        };
    }, [appointments, filters, loading]);

    return {
        loading,
        employees,
        services,
        dashboardData
    };
};
