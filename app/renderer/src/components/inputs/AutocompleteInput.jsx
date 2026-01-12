import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';

/**
 * Custom Autocomplete Input (Combobox behavior)
 * Allows free text entry + selection from options
 */
export default function AutocompleteInput({ options, value, onChange, onSelect, placeholder = "Escribir tratamiento..." }) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const triggerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    // Sync input value if prop changes
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target)) {
                if (!event.target.closest('.autocomplete-portal')) {
                    setOpen(false);
                }
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open]);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleFocus = () => {
        updatePosition();
        setOpen(true);
    };

    const handleChange = (e) => {
        const newVal = e.target.value;
        setInputValue(newVal);
        onChange(newVal);
        setOpen(true);
    };

    const getOptionLabel = (option) => {
        if (!option) return '';
        return option.title || option.name || option.label || '';
    };

    const handleSelect = (item) => {
        onSelect(item);
        setInputValue(getOptionLabel(item));
        setOpen(false);
    };

    const filteredOptions = (options || []).filter(opt => {
        if (!opt) return false;
        const text = getOptionLabel(opt).toLowerCase();
        const search = (inputValue || '').toLowerCase();
        return text.includes(search);
    });

    return (
        <>
            <div ref={triggerRef} className="relative w-full">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className="
                        w-full rounded-md border border-slate-200 dark:border-slate-700 
                        bg-white dark:bg-slate-800 px-3 py-2 pl-3 pr-8 text-xs 
                        placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20
                    "
                />
                <div className="absolute right-2 top-2.5 pointer-events-none">
                    <Search size={14} className="text-slate-400" />
                </div>
            </div>

            {open && filteredOptions.length > 0 && createPortal(
                <div
                    className="autocomplete-portal absolute z-[9999] overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-secondary shadow-md animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}
                >
                    {filteredOptions.map((option, index) => {
                        const label = getOptionLabel(option);
                        return (
                            <div
                                key={option.id || index}
                                onClick={() => handleSelect(option)}
                                className={`
                                    relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-xs outline-none 
                                    hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 cursor-pointer
                                    ${inputValue === label ? 'bg-slate-100 dark:bg-slate-800' : ''}
                                `}
                            >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: option.color || 'gray' }} />
                                </span>
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900 dark:text-slate-100">{label}</span>
                                    {option.description && (
                                        <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{option.description}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
}
