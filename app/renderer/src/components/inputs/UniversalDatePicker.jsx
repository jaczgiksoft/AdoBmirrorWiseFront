import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Datepicker from "react-tailwindcss-datepicker";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";

/**
 * UniversalDatePicker - Un componente de selección de fecha/rango con navegación inteligente.
 * Soporta modo fecha única y modo rango.
 * Renderiza fuera del contenedor (Portal) para evitar problemas de clipping por overflow.
 */
export default function UniversalDatePicker({
    value,
    onChange,
    label,
    error,
    placeholder = "Seleccionar fecha...",
    displayFormat = "YYYY-MM-DD",
    maxDate = null,
    minDate = null,
    inputClassName = "",
    required = false,
    popoverDirection = "down",
    useRange = false,
    asSingle = true,
    showShortcuts = false,
    i18n = "es",
    ...rest
}) {
    // Referencias para el posicionamiento
    const anchorRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, direction: "down" });

    const [isEditing, setIsEditing] = useState(false);
    const datepickerContainerRef = useRef(null);

    // Estado interno para manejar el objeto que requiere react-tailwindcss-datepicker
    const [dateValue, setDateValue] = useState(() => {
        if (useRange) {
            return {
                startDate: value?.startDate || null,
                endDate: value?.endDate || null,
            };
        }
        return {
            startDate: value || null,
            endDate: value || null,
        };
    });

    // Estado para mantener la posición del cursor entre re-renders
    const [cursorPos, setCursorPos] = useState(null);

    // Sincronizar el estado interno cuando cambia la prop value
    useEffect(() => {
        if (useRange) {
            setDateValue({
                startDate: value?.startDate || null,
                endDate: value?.endDate || null,
            });
        } else {
            setDateValue({
                startDate: value || null,
                endDate: value || null,
            });
        }
    }, [value, useRange]);

    // Función para actualizar la posición del componente portaleado
    const updatePosition = () => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Si hay menos de 380px abajo y hay más espacio arriba, abrir hacia arriba
            const calculatedDirection = (spaceBelow < 380 && spaceAbove > spaceBelow) ? "up" : "down";

            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                direction: popoverDirection !== "down" ? popoverDirection : calculatedDirection
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
    }, [isEditing]);

    const handleInternalChange = (newValue) => {
        setDateValue(newValue);
        if (useRange) {
            if (onChange) onChange(newValue);
        } else {
            const date = newValue?.startDate || "";
            if (onChange) onChange(date);
        }
    };

    const handleKeyDown = (e) => {
        // La navegación inteligente por teclado solo se activa en modo de fecha única
        // y con formato YYYY-MM-DD para evitar conflictos con la lógica de rangos.
        if (useRange || displayFormat !== "YYYY-MM-DD") return;

        // Cerrar modo edición al presionar Enter o Escape
        if (e.key === "Enter" || e.key === "Escape") {
            setIsEditing(false);
            return;
        }

        // Bloqueo de teclas no permitidas (solo números, flechas y controles)
        const isNumber = e.key >= "0" && e.key <= "9";
        const isArrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);
        const isControl = ["Backspace", "Delete", "Tab", "Enter", "Escape"].includes(e.key);

        if (!isNumber && !isArrow && !isControl) {
            e.preventDefault();
            return;
        }

        const input = e.target;
        let pos = input.selectionStart;

        // Si se presiona un número, reemplazar el dígito actual y saltar al siguiente
        if (isNumber) {
            e.preventDefault();
            const val = input.value;
            if (val.length === 10) {
                const char = e.key;
                const newValueStr = val.substring(0, pos) + char + val.substring(pos + 1);

                // Validar límites si la fecha es válida
                const newDayjs = dayjs(newValueStr);
                if (newDayjs.isValid()) {
                    if (maxDate && newDayjs.isAfter(dayjs(maxDate))) return;
                    if (minDate && newDayjs.isBefore(dayjs(minDate))) return;
                }

                handleInternalChange({
                    startDate: newValueStr,
                    endDate: newValueStr,
                });

                let nextPos = pos + 1;
                if (nextPos === 4 || nextPos === 7) nextPos++; // Saltar guion
                if (nextPos > 9) nextPos = 9;

                setCursorPos(nextPos);
                return;
            }
        }

        // Navegación inteligente (flechas laterales)
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

        // Incremento/Decremento (flechas arriba/abajo)
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

        // Validar límites
        if (maxDate && newDayjs.isAfter(dayjs(maxDate))) return;
        if (minDate && newDayjs.isBefore(dayjs(minDate))) return;

        const newDateStr = newDayjs.format("YYYY-MM-DD");

        handleInternalChange({
            startDate: newDateStr,
            endDate: newDateStr,
        });

        setCursorPos(pos);
    };

    const handleMouseInteraction = (e) => {
        if (useRange || displayFormat !== "YYYY-MM-DD") return;

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

    // Formatear el valor para mostrarlo en el input visual
    const getFormattedValue = () => {
        if (useRange) {
            if (!value?.startDate || !value?.endDate) return "";
            const start = dayjs(value.startDate).format(displayFormat);
            const end = dayjs(value.endDate).format(displayFormat);
            return `${start} ~ ${end}`;
        }
        return value ? dayjs(value).format(displayFormat) : "";
    };

    const formattedValue = getFormattedValue();

    // Efecto para restaurar el foco y la selección (solo modo fecha única inteligente)
    useEffect(() => {
        if (isEditing && datepickerContainerRef.current && !useRange && displayFormat === "YYYY-MM-DD") {
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
    }, [isEditing, dateValue, cursorPos, useRange, displayFormat]);

    // Manejar clics fuera para cerrar el modo edición
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

    // Bloquear el scroll del body cuando estamos en modo edición
    useEffect(() => {
        if (isEditing) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isEditing]);

    // Prevenir específicamente que la rueda del ratón actúe sobre toda la ventana
    useEffect(() => {
        if (isEditing) {
            const handleWheel = (e) => e.preventDefault();
            window.addEventListener("wheel", handleWheel, { passive: false });
            return () => window.removeEventListener("wheel", handleWheel);
        }
    }, [isEditing]);

    return (
        <div className="w-full relative">
            {label && (
                <div className="flex justify-between items-center mb-1">
                    <label className={`text-sm ${required ? 'label-required' : ''}`}>
                        {label}
                    </label>
                </div>
            )}

            {/* Input Visual (Fuera del Portal) */}
            <div ref={anchorRef} className="w-full relative">
                {!isEditing ? (
                    <div className="relative group">
                        <input
                            readOnly
                            value={formattedValue}
                            placeholder={placeholder}
                            className={`input w-full !cursor-pointer pr-10 ${error ? "border-error ring-1 ring-error/50" : ""} ${inputClassName}`}
                            onFocus={() => setIsEditing(true)}
                            onClick={() => setIsEditing(true)}
                        />
                        <Calendar
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary transition-colors"
                        />
                    </div>
                ) : (
                    <div className="w-full h-[38px]" />
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
                            containerClassName="relative z-[9999]"
                            useRange={useRange}
                            asSingle={asSingle}
                            showShortcuts={showShortcuts}
                            i18n={i18n}
                            {...rest}
                            value={{
                                startDate: dateValue.startDate ? dayjs(dateValue.startDate).toDate() : null,
                                endDate: dateValue.endDate ? dayjs(dateValue.endDate).toDate() : null
                            }}
                            onChange={(newValue) => {
                                const formatted = {
                                    startDate: newValue?.startDate ? dayjs(newValue.startDate).format("YYYY-MM-DD") : null,
                                    endDate: newValue?.endDate ? dayjs(newValue.endDate).format("YYYY-MM-DD") : null
                                };
                                handleInternalChange(formatted);
                            }}
                            displayFormat={displayFormat}
                            placeholder={placeholder}
                            readOnly={!(!useRange && displayFormat === "YYYY-MM-DD")} // Solo editable por teclado si es modo inteligente
                            maxDate={maxDate ? dayjs(maxDate).toDate() : null}
                            minDate={minDate ? dayjs(minDate).toDate() : null}
                            startFrom={dateValue.startDate && dayjs(dateValue.startDate).isValid()
                                ? dayjs(dateValue.startDate).toDate()
                                : new Date()}
                            popoverDirection={coords.direction}
                            inputClassName={`input w-full ${error ? "border-error ring-1 ring-error/50" : ""} ${inputClassName}`}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
//Para Fecha Única:
{/* <UniversalDatePicker
    value={dateValue}
    onChange={handleDateChange}
    useRange={false}
    asSingle={true}
    displayFormat="YYYY-MM-DD"
    placeholder="Seleccionar fecha..."
/> */}

//Para Rango de Fechas:
{/* <UniversalDatePicker
    value={dateRange}
    onChange={setDateRange}
    useRange={true}
    showShortcuts={true}
    displayFormat="DD/MM/YYYY"
    placeholder="Rango de fechas..."
/> */}
