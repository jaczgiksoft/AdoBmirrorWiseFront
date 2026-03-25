import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceSettingsModal({ isOpen, onClose, onSettingsChange }) {
    const [voices, setVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Initialize speech synthesis and load voices
    useEffect(() => {
        if (!isOpen) return;

        const loadVoices = () => {
            if ('speechSynthesis' in window) {
                const availableVoices = window.speechSynthesis.getVoices();
                const spanishVoices = availableVoices.filter(v => v.lang.startsWith('es'));
                
                if (spanishVoices.length > 0) {
                    setVoices(spanishVoices);
                    
                    if (!selectedVoiceURI) {
                        setSelectedVoiceURI(spanishVoices[0].voiceURI);
                    }
                }
            }
        };

        loadVoices();
        
        // Browsers load voices asynchronously, so we listen for the event
        if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        
    }, [isOpen, selectedVoiceURI]);

    // Load saved settings from localStorage on open
    useEffect(() => {
        if (isOpen) {
            const savedSettingsStr = localStorage.getItem('odontogram_voice_settings');
            if (savedSettingsStr) {
                try {
                    const settings = JSON.parse(savedSettingsStr);
                    if (settings.selectedVoiceURI !== undefined) setSelectedVoiceURI(settings.selectedVoiceURI);
                    if (settings.isMuted !== undefined) setIsMuted(settings.isMuted);
                } catch (e) {
                    console.error("Error parsing voice settings", e);
                }
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        const settings = {
            selectedVoiceURI,
            isMuted
        };
        localStorage.setItem('odontogram_voice_settings', JSON.stringify(settings));
        
        if (onSettingsChange) {
            onSettingsChange(settings);
        }
        onClose();
    };

    const handleTestVoice = () => {
        if (!('speechSynthesis' in window)) return;
        if (isMuted) return; // Don't test if currently checking the mute box

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        setIsTesting(true);

        const textToTest = "Hola, esta es una prueba de la voz seleccionada.";
        const utterance = new SpeechSynthesisUtterance(textToTest);
        
        // Find the full voice object based on the URI
        const voiceObj = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (voiceObj) {
            utterance.voice = voiceObj;
        }

        utterance.onend = () => setIsTesting(false);
        utterance.onerror = () => setIsTesting(false);

        window.speechSynthesis.speak(utterance);
    };
    
    // Cleanup if closed while speaking
    useEffect(() => {
        if (!isOpen && isTesting) {
            window.speechSynthesis.cancel();
            setIsTesting(false);
        }
    }, [isOpen, isTesting]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                    Configuración de Voz
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Ajustes de asistencia por voz para el odontograma.
                                </p>
                            </div>
                            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            
                            {/* Mute Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Silenciar Voz</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Desactiva completamente la confirmación por voz.</p>
                                </div>
                                <label className="cursor-pointer relative inline-flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={isMuted}
                                        onChange={(e) => setIsMuted(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Voice Selection */}
                            <div className={`space-y-3 transition-opacity ${isMuted ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Seleccionar Voz
                                </label>
                                
                                {voices.length === 0 ? (
                                    <div className="p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                        Cargando voces o tu navegador no soporta síntesis de voz.
                                    </div>
                                ) : (
                                    <select 
                                        className="select select-bordered w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                                        value={selectedVoiceURI}
                                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                                        disabled={isMuted}
                                    >
                                        {voices.map((voice, idx) => (
                                            <option key={`${voice.voiceURI}-${idx}`} value={voice.voiceURI}>
                                                {voice.name} ({voice.lang}) {voice.default ? ' - Por defecto' : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Test Audio Button */}
                                <div className="pt-2">
                                    <button 
                                        type="button" 
                                        onClick={handleTestVoice}
                                        disabled={isMuted || voices.length === 0 || isTesting}
                                        className={`btn btn-sm flex items-center gap-2 ${isTesting ? 'btn-success' : 'btn-outline text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                                    >
                                        {isTesting ? (
                                            <>
                                                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                                Reproduciendo...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Probar Voz
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="btn btn-ghost border border-slate-300 dark:border-slate-600">
                                Cancelar
                            </button>
                            <button type="button" onClick={handleSave} className="btn btn-primary bg-blue-600 hover:bg-blue-700 border-none shadow-md shadow-blue-500/30">
                                Guardar Configuración
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
