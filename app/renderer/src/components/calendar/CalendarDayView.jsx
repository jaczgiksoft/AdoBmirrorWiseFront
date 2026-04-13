import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from "@fullcalendar/interaction";
import CalendarEventCard from "./CalendarEventCard";

export default function CalendarDayView({ events, onEventClick, calendarRef, resources, datesSet, onEventEdit }) {

    return (
        <div className="h-full calendar-day-wrapper">
            <style>{`
                /* Theme Variables */
                :root {
                    --fc-grid-bg: #F8FAFC;
                    --fc-slot-alt: #F1F5F9;
                    --fc-border-color: #E2E8F0;
                    --fc-header: #FFFFFF;
                }
                .dark {
                    --fc-grid-bg: #0F172A;
                    --fc-slot-alt: #1E293B;
                    --fc-border-color: #1E293B;
                    --fc-header: #1E293B;
                }

                /* Calendar Grid Backgrounds */
                .fc-theme-standard .fc-scrollgrid { border-color: var(--fc-border-color); }
                .fc-theme-standard td, .fc-theme-standard th { border-color: var(--fc-border-color); }
                
                .fc-timegrid-slots tr { background-color: var(--fc-grid-bg); }
                .fc-timegrid-col { background-color: var(--fc-grid-bg); }
                
                /* Resource Header styling */
                .fc-col-header-cell { background-color: var(--fc-header) !important; color: inherit; }
                .fc-timegrid-axis { background-color: var(--fc-header); }

                /* Events styling override */
                
                .fc-timegrid-event:hover { z-index: 10 !important; }
                
                /* Adjust Resource Header Text */
                .fc-col-header-cell-cushion { padding: 8px !important; font-size: 13px; font-weight: 600; color: inherit; }
            `}</style>
            <FullCalendar
                ref={calendarRef}
                plugins={[resourceTimeGridPlugin, interactionPlugin]}
                initialView="resourceTimeGridDay"
                headerToolbar={false}
                events={events} // Events must map resourceId to show in cols
                resources={resources} // Array of { id, title }
                eventContent={(arg) => <CalendarEventCard event={arg.event} />}
                datesSet={datesSet}
                slotMinTime="08:00:00"
                slotMaxTime="19:00:00"
                slotLabelFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: false
                }}
                allDaySlot={false}
                height="100%"
                slotDuration="00:10:00"
                slotLabelInterval="00:10:00"
                nowIndicator={true}
                locale="es"
                schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives" // Standard open source license for non-commercial/dev 
                eventClick={() => { }}

                eventDidMount={(info) => {
                    let clickTimeout = null;

                    info.el.addEventListener("click", () => {
                        if (clickTimeout) return;

                        clickTimeout = setTimeout(() => {
                            clickTimeout = null;
                            onEventClick(info);
                        }, 200);
                    });

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
