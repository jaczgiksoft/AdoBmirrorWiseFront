import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Datepicker from "react-tailwindcss-datepicker";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";

export default function DateInput({ label, value, onChange, popoverDirection = "down", required = false }) {
    const anchorRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const datepickerContainerRef = useRef(null);
    const [cursorPos, setCursorPos] = useState(null);

    const [dateValue, setDateValue] = useState({
        startDate: value || null,
        endDate: value || null
    });

    useEffect(() => {
        setDateValue({
            startDate: value || null,
            endDate: value || null
        });
    }, [value]);

    // Función para actualizar la posición del componente portaleado
    const updatePosition = () => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width
            });
        }
    };

    // Actualizar posición al montar y al cambiar dimensiones/scroll
    useEffect(() => {
        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, []);

    const handleDateChange = (newValue) => {
        setDateValue(newValue);
        const date = newValue?.startDate || "";
        onChange(date);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === "Escape") {
            setIsEditing(false);
            return;
        }

        const isNumber = e.key >= "0" && e.key <= "9";
        const isArrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);
        const isControl = ["Backspace", "Delete", "Tab", "Enter", "Escape"].includes(e.key);

        if (!isNumber && !isArrow && !isControl) {
            e.preventDefault();
            return;
        }

        const input = e.target;
        let pos = input.selectionStart;

        if (isNumber) {
            e.preventDefault();
            const val = input.value;
            if (val.length === 10) {
                const char = e.key;
                const newValue = val.substring(0, pos) + char + val.substring(pos + 1);

                handleDateChange({
                    startDate: newValue,
                    endDate: newValue,
                });

                let nextPos = pos + 1;
                if (nextPos === 4 || nextPos === 7) nextPos++;
                if (nextPos > 9) nextPos = 9;

                setCursorPos(nextPos);
                return;
            }
        }

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            if (e.key === "ArrowRight") {
                pos++;
                if (pos === 4 || pos === 7) pos++;
                if (pos > 9) pos = 9;
            } else {
                pos--;
                if (pos === 4 || pos === 7) pos--;
                if (pos < 0) pos = 0;
            }
            input.setSelectionRange(pos, pos + 1);
            setCursorPos(pos);
            return;
        }

        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

        const val = input.value;
        if (!val || val.length !== 10) return;

        e.preventDefault();

        let segment = "day";
        if (pos >= 0 && pos <= 3) segment = "year";
        else if (pos >= 5 && pos <= 6) segment = "month";

        const amount = e.key === "ArrowUp" ? 1 : -1;
        const currentDayjs = dayjs(val);
        if (!currentDayjs.isValid()) return;

        const newDayjs = currentDayjs.add(amount, segment);
        const newDateStr = newDayjs.format("YYYY-MM-DD");

        handleDateChange({
            startDate: newDateStr,
            endDate: newDateStr,
        });

        setCursorPos(pos);
    };

    const handleMouseInteraction = (e) => {
        const input = e.target;
        if (input.tagName !== "INPUT") return;

        setTimeout(() => {
            let pos = input.selectionStart;
            if (pos === 4 || pos === 7) pos++;
            if (pos > 9) pos = 9;
            input.setSelectionRange(pos, pos + 1);
            setCursorPos(pos);
        }, 10);
    };

    useEffect(() => {
        if (isEditing && datepickerContainerRef.current) {
            const input = datepickerContainerRef.current.querySelector('input');
            if (input) {
                const targetPos = cursorPos !== null ? cursorPos : 0;
                const timer = setTimeout(() => {
                    input.focus();
                    input.setSelectionRange(targetPos, targetPos + 1);
                }, 20);
                return () => clearTimeout(timer);
            }
        }
    }, [isEditing, dateValue, cursorPos]);

    useEffect(() => {
        if (!isEditing) return;
        const handleClickOutside = (e) => {
            if (datepickerContainerRef.current && !datepickerContainerRef.current.contains(e.target)) {
                if (anchorRef.current && !anchorRef.current.contains(e.target)) {
                    setIsEditing(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isEditing]);

    useEffect(() => {
        if (isEditing) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isEditing]);

    useEffect(() => {
        if (isEditing) {
            const handleWheel = (e) => e.preventDefault();
            window.addEventListener("wheel", handleWheel, { passive: false });
            return () => window.removeEventListener("wheel", handleWheel);
        }
    }, [isEditing]);

    const handleActivate = () => {
        if (!value) {
            const today = dayjs().format("YYYY-MM-DD");
            handleDateChange({
                startDate: today,
                endDate: today
            });
        }
        setIsEditing(true);
    };

    const formattedValue = value ? dayjs(value).format("YYYY-MM-DD") : "";

    return (
        <div className="w-full relative">
            {label && (
                <label className={`block text-xs font-semibold text-slate-500 uppercase mb-1.5 ${required ? 'label-required' : ''}`}>
                    {label}
                </label>
            )}

            {/* Input Visual (Fuera del Portal): Se muestra cuando NO estamos editando */}
            <div ref={anchorRef} className="w-full relative">
                {!isEditing ? (
                    <div className="relative group">
                        <input
                            readOnly
                            value={formattedValue}
                            placeholder="Seleccionar fecha..."
                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm !cursor-pointer pr-10"
                            onFocus={handleActivate}
                            onClick={handleActivate}
                        />
                        <Calendar
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary transition-colors"
                        />
                    </div>
                ) : (
                    <div className="w-full h-[36px]" /> // Mantener el espacio en el layout
                )}
            </div>

            {/* Modo Edición (Dentro del Portal) */}
            {isEditing && coords.width > 0 && createPortal(
                <div
                    ref={datepickerContainerRef}
                    style={{
                        position: "fixed",
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999,
                        pointerEvents: "none"
                    }}
                >
                    <div
                        style={{ pointerEvents: "auto" }}
                        onKeyDown={handleKeyDown}
                        onMouseUp={handleMouseInteraction}
                        onFocus={handleMouseInteraction}
                    >
                        <Datepicker
                            value={{
                                startDate: dateValue.startDate ? dayjs(dateValue.startDate).toDate() : null,
                                endDate: dateValue.endDate ? dayjs(dateValue.endDate).toDate() : null
                            }}
                            onChange={(newValue) => {
                                const formatted = {
                                    startDate: newValue?.startDate ? dayjs(newValue.startDate).format("YYYY-MM-DD") : null,
                                    endDate: newValue?.endDate ? dayjs(newValue.endDate).format("YYYY-MM-DD") : null
                                };
                                handleDateChange(formatted);
                            }}
                            useRange={false}
                            asSingle={true}
                            displayFormat={"YYYY-MM-DD"}
                            placeholder="Seleccionar fecha..."
                            readOnly={false} // Cambiado a false para permitir escritura
                            i18n={"es"}
                            containerClassName="relative z-[9999]"
                            popoverDirection={popoverDirection}
                            inputClassName="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                            startFrom={dateValue.startDate && dayjs(dateValue.startDate).isValid()
                                ? dayjs(dateValue.startDate).toDate()
                                : new Date()}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
