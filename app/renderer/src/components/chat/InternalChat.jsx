import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, User, Search, ArrowLeft, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { API_BASE } from "@/utils/apiBase";

export default function InternalChat({ isOpen, onClose }) {
    const { user } = useAuthStore();
    const { socket } = useNotificationStore();
    const {
        chats,
        employees,
        history,
        loading,
        historyLoading,
        fetchChats,
        fetchEmployees,
        fetchHistory,
        sendChatMessage,
        setupSocketListeners,
        clearSelectedChat,
        selectedChatId
    } = useChatStore();

    const [view, setView] = useState("list"); // 'list' or 'chat'
    const [searchTerm, setSearchTerm] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const scrollRef = useRef(null);

    // Inicializar datos al abrir
    useEffect(() => {
        if (isOpen) {
            fetchChats();
            fetchEmployees();
        }
    }, [isOpen]);

    // Configurar listeners del socket globalmente (incluso si está cerrado)
    useEffect(() => {
        if (socket) {
            setupSocketListeners(socket);
        }
    }, [socket, setupSocketListeners]);

    // Auto-scroll al final
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, historyLoading]);

    // Filtrar empleados por búsqueda
    const filteredEmployees = employees.filter(emp =>
        emp.user?.id !== user.id && // No mostrarse a sí mismo
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectEmployee = async (emp) => {
        setSelectedEmployee(emp);
        setView("chat");

        // Buscar si ya existe un chat con este empleado
        const existingChat = chats.find(c =>
            c.participants.some(p => p.user_id === emp.user?.id)
        );

        if (existingChat) {
            await fetchHistory(existingChat.id);
        } else {
            clearSelectedChat();
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedEmployee) return;

        const msg = messageInput.trim();
        setMessageInput("");

        try {
            await sendChatMessage(selectedEmployee.user?.id, msg);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleBack = () => {
        setView("list");
        setSelectedEmployee(null);
        clearSelectedChat();
        fetchChats();
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
                                {view === "chat" && (
                                    <button onClick={handleBack} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                        <ArrowLeft size={20} className="text-slate-500" />
                                    </button>
                                )}
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">
                                        {view === "list" ? "Chat Interno" : selectedEmployee?.full_name}
                                    </h3>
                                    <p className="text-[10px] text-primary font-medium uppercase tracking-wider">
                                        {view === "list" ? "Comunicación entre empleados" : "En línea"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-secondary/50">
                            {view === "list" ? (
                                <>
                                    {/* Search */}
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-secondary">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Buscar empleado..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 dark:text-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Employee List */}
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <Loader2 size={32} className="animate-spin mb-2" />
                                                <p className="text-sm">Cargando chats...</p>
                                            </div>
                                        ) : filteredEmployees.length > 0 ? (
                                            filteredEmployees.map((emp) => {
                                                const chat = chats.find(c => c.participants.some(p => p.user_id === emp.user?.id));
                                                return (
                                                    <button
                                                        key={emp.id}
                                                        onClick={() => handleSelectEmployee(emp)}
                                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="relative">
                                                            {emp.profile_image ? (
                                                                <img
                                                                    src={`${API_BASE}${emp.profile_image}`}
                                                                    alt={emp.full_name}
                                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                                    <User size={24} />
                                                                </div>
                                                            )}
                                                            {chat?.unreadCount > 0 && (
                                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-secondary">
                                                                    {chat.unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">
                                                                    {emp.full_name}
                                                                </h4>
                                                                {chat?.messages?.[0] && (
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {new Date(chat.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                {chat?.messages?.[0]?.message || "Toca para iniciar un chat"}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                                <Search size={48} className="mb-4 opacity-20" />
                                                <p className="text-sm">No se encontraron empleados con ese nombre.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Messages View */}
                                    <div
                                        ref={scrollRef}
                                        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                                    >
                                        {historyLoading ? (
                                            <div className="flex justify-center items-center h-full">
                                                <Loader2 size={24} className="animate-spin text-primary" />
                                            </div>
                                        ) : history.length > 0 ? (
                                            history.map((msg, idx) => {
                                                const isMine = msg.sender_id === user.id;
                                                return (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        key={msg.id || idx}
                                                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div className={`flex gap-2 max-w-[85%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                                            {!isMine && (
                                                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] flex-shrink-0">
                                                                    {selectedEmployee?.full_name?.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                                                                <div className={`p-3 rounded-2xl text-sm shadow-sm
                                                                    ${isMine
                                                                        ? "bg-primary text-white rounded-tr-none"
                                                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none"}`}
                                                                >
                                                                    {msg.message}
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 p-8 text-center">
                                                <MessageSquare size={64} className="mb-4" />
                                                <p className="text-sm font-medium">No hay mensajes aún</p>
                                                <p className="text-xs">Envía un mensaje para iniciar la conversación.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <form
                                        onSubmit={handleSendMessage}
                                        className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-secondary"
                                    >
                                        <div className="relative flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                placeholder="Escribe un mensaje..."
                                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 dark:text-white transition-all"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        handleSendMessage(e);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!messageInput.trim()}
                                                className={`p-3 rounded-xl transition-all shadow-md
                                                    ${!messageInput.trim()
                                                        ? "bg-slate-200 text-slate-400 dark:bg-slate-700 cursor-not-allowed"
                                                        : "bg-primary text-white hover:scale-105 active:scale-95"}`}
                                            >
                                                <Send size={20} />
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
