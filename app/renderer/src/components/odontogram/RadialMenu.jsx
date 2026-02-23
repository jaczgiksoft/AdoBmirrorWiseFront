import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

/**
 * Reusable Radial Menu
 * 
 * Props:
 * - x (number): X coordinate for the center of the menu.
 * - y (number): Y coordinate for the center of the menu.
 * - options (array): List of items to display.
 *   - id: string
 *   - label: string
 *   - icon: ReactNode (optional)
 *   - color: string (optional Tailwind class)
 * - onSelect (function): Callback when an option is selected.
 * - onClose (function): Callback when the menu is closed (click outside or Esc).
 * - radius (number): Spread radius of the options. Default is 90px.
 * 
 * Note: To enable exit animations, ensure you wrap the rendering of this component
 * inside an <AnimatePresence> in the parent component.
 */
const RadialMenu = ({
    x,
    y,
    options = [],
    onSelect,
    onClose,
    radius = 90,
}) => {
    // Handle escape key to close the menu
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Framer motion variants for the backdrop overlay
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
    };

    // Function to calculate variants for each menu item using trigonometry
    const getItemVariants = (index, total) => {
        // Start at -90 degrees (top center) and distribute evenly
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;

        // Calculate final X and Y using sine and cosine
        const finalX = Math.cos(angle) * radius;
        const finalY = Math.sin(angle) * radius;

        return {
            hidden: { x: 0, y: 0, opacity: 0, scale: 0 },
            visible: {
                x: finalX,
                y: finalY,
                opacity: 1,
                scale: 1,
                transition: {
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.05, // Stagger effect
                }
            },
            exit: {
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0,
                transition: { duration: 0.2 }
            }
        };
    };

    // Render the menu using a Portal to ensure it sits on top of all other DOM elements
    return createPortal(
        <motion.div
            className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
        >
            <div
                className="absolute"
                style={{ left: x, top: y }}
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the center area from closing
            >
                {/* Center Close button / Anchor */}
                <motion.button
                    className="absolute flex items-center justify-center w-10 h-10 -ml-5 -mt-5 rounded-full bg-white dark:bg-slate-800 shadow-lg text-slate-500 hover:text-red-500 hover:scale-110 transition-transform z-10"
                    onClick={onClose}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </motion.button>

                {/* Radial Options */}
                {options.map((option, index) => (
                    <motion.button
                        key={option.id}
                        className={`absolute flex items-center justify-center w-12 h-12 -ml-6 -mt-6 rounded-full shadow-lg border border-white/10 ${option.color || 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 group`}
                        variants={getItemVariants(index, options.length)}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover={{ scale: 1.15, filter: 'brightness(1.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            onSelect(option);
                            onClose();
                        }}
                    >
                        {option.icon ? (
                            <span className="text-xl pointer-events-none flex items-center justify-center">
                                {option.icon}
                            </span>
                        ) : (
                            <span className="text-xs font-bold uppercase pointer-events-none">
                                {option.label.substring(0, 2)}
                            </span>
                        )}

                        {/* Tooltip Label */}
                        <span className="absolute top-[115%] scale-0 group-hover:scale-100 transition-transform origin-top bg-slate-800 dark:bg-slate-900 shadow-xl text-white text-[11px] font-medium py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-20">
                            {option.label}
                        </span>
                    </motion.button>
                ))}
            </div>
        </motion.div>,
        document.body
    );
};

export default RadialMenu;
