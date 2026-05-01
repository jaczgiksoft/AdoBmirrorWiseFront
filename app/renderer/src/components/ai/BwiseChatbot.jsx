import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, User, Trash2, Loader2, List, Table as TableIcon } from "lucide-react";
import api from "@/services/api";
import aiService from "@/services/ai.service";

/**
 * BwiseChatbot - Asistente IA para soporte operativo y clínico.
 * Conecta con el endpoint /api/chat-assistant/ask
 */
export default function BwiseChatbot({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "¡Hola! Soy tu asistente operativo de BWISE. ¿En qué puedo ayudarte hoy con el inventario, servicios o disponibilidad?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll al final del chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const result = await aiService.ask(userMessage, messages);

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: result.reply },
            ]);
        } catch (error) {
            console.error("Chatbot Error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: "assistant",
                content: "Chat reiniciado. ¿En qué más puedo ayudarte?",
            },
        ]);
    };

    // Función para detectar y renderizar contenido estructurado (tablas/listas)
    const renderContent = (content) => {
        // Intentar detectar si es un JSON (la IA a veces responde con JSON si se lo pedimos o si el tool lo devuelve crudo)
        // Pero normalmente el asistente devuelve texto plano con Markdown.
        // Si detectamos que parece una lista de objetos o algo similar, podríamos embellecerlo.

        // Por ahora, renderizado de texto simple con saltos de línea
        return (
            <div className="whitespace-pre-wrap break-words">
                {content}
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60]"
                    />

                    {/* Chat Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-md bg-white dark:bg-secondary shadow-2xl z-[70] flex flex-col border-l border-slate-200 dark:border-slate-700"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-primary/5 dark:bg-primary/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Asistente BWISE</h3>
                                    <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Soporte Operativo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={clearChat}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                                    title="Limpiar chat"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-slate-50/50 dark:bg-secondary/50"
                        >
                            {messages.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm
                                            ${msg.role === "user"
                                                ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                                : "bg-primary text-white"}`}
                                        >
                                            {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm shadow-sm
                                            ${msg.role === "user"
                                                ? "bg-primary text-white rounded-tr-none"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none"}`}
                                        >
                                            {renderContent(msg.content)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2 items-center text-slate-400 text-xs italic ml-10 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                        <Loader2 size={12} className="animate-spin" />
                                        <span>Bwise está pensando...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form
                            onSubmit={handleSend}
                            className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-secondary"
                        >
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Escribe tu consulta operativa..."
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 dark:text-white transition-all"
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            handleSend(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className={`p-3 rounded-xl transition-all shadow-md
                                        ${!input.trim() || loading
                                            ? "bg-slate-200 text-slate-400 dark:bg-slate-700 cursor-not-allowed"
                                            : "bg-primary text-white hover:scale-105 active:scale-95"}`}
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>

                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
