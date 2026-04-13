import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import CalendarEventCard from "./CalendarEventCard";

export default function CalendarMonthView({ events, onEventClick, calendarRef, customEventContent, datesSet, onDateClick, onMoreClick, onEventEdit }) {
    return (
        <div className="h-full calendar-month-wrapper">
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={events}
                eventContent={customEventContent ? customEventContent : (arg) => <CalendarEventCard event={arg.event} />}
                dateClick={(info) => {
                    onDateClick?.(info.dateStr);
                }}
                datesSet={datesSet}
                height="100%"
                locale="es"
                dayMaxEvents={true}
                moreLinkClick={(arg) => {
                    onMoreClick?.(arg.date);
                    return "none";
                }}
                eventClick={() => { }} // 👈 desactivamos el default

                eventDidMount={(info) => {
                    let clickTimeout = null;

                    // CLICK NORMAL → VER DETALLE
                    info.el.addEventListener("click", () => {
                        if (clickTimeout) return;

                        clickTimeout = setTimeout(() => {
                            clickTimeout = null;
                            onEventClick(info);
                        }, 200);
                    });

                    // DOBLE CLICK → EDITAR
                    info.el.addEventListener("dblclick", () => {
                        if (clickTimeout) {
                            clearTimeout(clickTimeout);
                            clickTimeout = null;
                        }

                        onEventEdit?.(info);
                    });
                }}
            />
        </div>
    );
}
