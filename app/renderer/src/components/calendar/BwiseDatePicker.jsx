import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Datepicker from "react-tailwindcss-datepicker";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";

/**
 * BwiseDatePicker - Un componente de selección de fecha con navegación inteligente por teclado.
 * Renderiza fuera del modal (Portal) para evitar problemas de clipping por overflow.
 */
export default function BwiseDatePicker({
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
    ...rest
}) {
    // Referencias para el posicionamiento
    const anchorRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const [isEditing, setIsEditing] = useState(false);
    const datepickerContainerRef = useRef(null);

    // Estado interno para manejar el objeto que requiere react-tailwindcss-datepicker
    const [dateValue, setDateValue] = useState({
        startDate: value || null,
        endDate: value || null,
    });

    // Estado para mantener la posición del cursor entre re-renders (especialmente cuando cambia la key)
    const [cursorPos, setCursorPos] = useState(null);

    // Sincronizar el estado interno cuando cambia la prop value
    useEffect(() => {
        setDateValue({
            startDate: value || null,
            endDate: value || null,
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
        // Usamos capture: true para detectar scrolls dentro de contenedores (como el modal)
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, []);

    const handleInternalChange = (newValue) => {
        setDateValue(newValue);
        const date = newValue?.startDate || "";
        if (onChange) onChange(date);
    };

    const handleKeyDown = (e) => {
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
                const newValue = val.substring(0, pos) + char + val.substring(pos + 1);

                // Validar límites si la fecha es válida
                const newDayjs = dayjs(newValue);
                if (newDayjs.isValid()) {
                    if (maxDate && newDayjs.isAfter(dayjs(maxDate))) return;
                    if (minDate && newDayjs.isBefore(dayjs(minDate))) return;
                }

                handleInternalChange({
                    startDate: newValue,
                    endDate: newValue,
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
    const formattedValue = value ? dayjs(value).format(displayFormat) : "";

    // Efecto para restaurar el foco y la selección cuando cambia el valor o se entra en modo edición
    // Esto es CRUCIAL porque si cambia el mes/año, la 'key' del Datepicker cambia y el componente se remonta
    useEffect(() => {
        if (isEditing && datepickerContainerRef.current) {
            const input = datepickerContainerRef.current.querySelector('input');
            if (input) {
                // Solo aplicar si tenemos una posición guardada o si es el primer enfoque
                const targetPos = cursorPos !== null ? cursorPos : 0;

                // Usamos requestAnimationFrame o un pequeño timeout para asegurar que el DOM esté listo tras el posible re-montaje por key
                const timer = setTimeout(() => {
                    input.focus();
                    input.setSelectionRange(targetPos, targetPos + 1);
                }, 20);

                return () => clearTimeout(timer);
            }
        }
    }, [isEditing, dateValue, cursorPos]);

    // Manejar clics fuera para cerrar el modo edición
    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (e) => {
            // Si el clic no es dentro del portal ni dentro del ancla, cerramos
            if (datepickerContainerRef.current && !datepickerContainerRef.current.contains(e.target)) {
                if (anchorRef.current && !anchorRef.current.contains(e.target)) {
                    setIsEditing(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isEditing]);

    // Bloquear el scroll del body cuando estamos en modo edición para evitar desplazamientos accidentales
    useEffect(() => {
        if (isEditing) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isEditing]);

    // Prevenir específicamente que la rueda del ratón (rueda de desplazamiento) actúe sobre toda la ventana mientras estamos editando
    useEffect(() => {
        if (isEditing) {
            const handleWheel = (e) => e.preventDefault();
            window.addEventListener("wheel", handleWheel, { passive: false });
            return () => window.removeEventListener("wheel", handleWheel);
        }
    }, [isEditing]);

    // Renderizado del componente
    return (
        <div className="w-full relative">
            {label && (
                <div className="flex justify-between items-center mb-1">
                    <label className={`text-sm ${required ? 'label-required' : ''}`}>
                        {label}
                    </label>
                </div>
            )}

            {/* Input Visual (Fuera del Portal): Se muestra cuando NO estamos editando */}
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
                    <div className="w-full h-[38px]" /> // Mantener el espacio en el layout
                )}
            </div>

            {/* 
              Modo Edición (Dentro del Portal): Se muestra solo cuando el usuario interactúa.
              Esto permite que el calendario sobresalga de footers/modales sin "flotar" 
              constantemente sobre otros elementos al escrollear si no está activo.
            */}
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
                            /* 1. ELIMINAMOS LA KEY DINÁMICA PARA EVITAR EL PARPADEO */
                            containerClassName="relative z-[9999]"
                            useRange={false}
                            asSingle={true}
                            i18n={"es"}
                            {...rest}
                            /* 2. Mantenemos el valor sincronizado */
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
                            readOnly={false}
                            maxDate={maxDate ? dayjs(maxDate).toDate() : null}
                            minDate={minDate ? dayjs(minDate).toDate() : null}

                            /* 3. ESTO MUEVE EL CALENDARIO SIN RE-MONTAR EL COMPONENTE */
                            startFrom={dateValue.startDate && dayjs(dateValue.startDate).isValid()
                                ? dayjs(dateValue.startDate).toDate()
                                : new Date()}

                            popoverDirection={popoverDirection}
                            inputClassName={`input w-full ${error ? "border-error ring-1 ring-error/50" : ""} ${inputClassName}`}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
