import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import CalendarEventCard from "./CalendarEventCard";

export default function CalendarMonthView({ events, onEventClick, calendarRef }) {
    return (
        <div className="h-full calendar-month-wrapper">
            <style>{`
                .fc-daygrid-event { background: transparent !important; border: none !important; white-space: normal !important; align-items: start !important; }
                .fc-event-main { width: 100%; overflow: hidden; }
                .fc-daygrid-dot-event:hover { background: transparent !important; }
                /* Custom scrollbar for day cell if too many events */
                .fc-daygrid-day-frame { overflow-y: auto !important; } 
                .fc-daygrid-day-events { margin-bottom: 0 !important; }
            `}</style>
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={events}
                eventContent={(arg) => <CalendarEventCard event={arg.event} />}
                eventClick={onEventClick}
                height="100%"
                locale="es"
                dayMaxEvents={false} /* Show all events, let cell scroll */
            />
        </div>
    );
}
