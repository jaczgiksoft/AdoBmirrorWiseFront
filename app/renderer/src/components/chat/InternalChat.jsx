import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, User, Search, ArrowLeft, Loader2, Users, Check, CheckCheck, Plus } from "lucide-react";
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
        createGroupChat,
        selectedChatId
    } = useChatStore();

    const [view, setView] = useState("list"); // 'list', 'chat', 'newGroup'
    const [searchTerm, setSearchTerm] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [currentChat, setCurrentChat] = useState(null);

    // New Group State
    const [groupName, setGroupName] = useState("");
    const [selectedGroupEmployees, setSelectedGroupEmployees] = useState([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    const scrollRef = useRef(null);

    // Inicializar datos al abrir
    useEffect(() => {
        if (isOpen) {
            fetchChats();
            fetchEmployees();
        }
    }, [isOpen]);

    // Configurar listeners del socket globalmente
    useEffect(() => {
        if (socket) {
            setupSocketListeners(socket);
        }
    }, [socket, setupSocketListeners]);

    // Auto-scroll al final de los mensajes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, historyLoading]);

    // Construir lista combinada: Chats existentes + Empleados sin chat privado
    const combinedList = [
        ...chats.map(c => ({ ...c, isChat: true })),
        ...employees
            .filter(emp => emp.user?.id !== user.id) // Excluir a sí mismo
            .filter(emp => !chats.some(c => c.type === "private" && c.participants.some(p => p.user_id === emp.user?.id)))
            .map(emp => ({ ...emp, isEmployee: true }))
    ];

    const filteredList = combinedList.filter(item => {
        const term = searchTerm.toLowerCase();
        if (item.isChat) {
            if (item.type === "group") return item.name?.toLowerCase().includes(term);
            const otherP = item.participants?.find(p => p.user_id !== user.id);
            const otherName = `${otherP?.user?.employee?.first_name} ${otherP?.user?.employee?.last_name}`;
            return otherName.toLowerCase().includes(term);
        } else {
            return item.full_name?.toLowerCase().includes(term);
        }
    });

    const handleSelectChat = async (item) => {
        setCurrentChat(item);
        setView("chat");

        if (item.isChat) {
            await fetchHistory(item.id);
        } else {
            clearSelectedChat();
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentChat) return;

        const msg = messageInput.trim();
        setMessageInput("");

        const payload = { message: msg };
        if (currentChat.isChat) {
            payload.chat_id = currentChat.id;
        } else {
            payload.receiver_id = currentChat.user?.id;
        }

        try {
            await sendChatMessage(payload);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleBack = () => {
        setView("list");
        setCurrentChat(null);
        clearSelectedChat();
        setGroupName("");
        setSelectedGroupEmployees([]);
        fetchChats();
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedGroupEmployees.length === 0) return;
        setIsCreatingGroup(true);
        try {
            await createGroupChat({
                name: groupName.trim(),
                participant_ids: selectedGroupEmployees
            });
            handleBack(); // Regresar a la lista, se recargará
        } catch (error) {
            console.error("Error al crear grupo:", error);
        } finally {
            setIsCreatingGroup(false);
        }
    };

    // Derived info for Chat Header
    let chatTitle = "Chat Interno";
    let chatSubtitle = "Comunicación entre empleados";
    let isGroupChat = false;

    if (view === "chat" && currentChat) {
        if (currentChat.isChat) {
            if (currentChat.type === "group") {
                chatTitle = currentChat.name;
                chatSubtitle = `Grupo • ${currentChat.participants?.length || 0} participantes`;
                isGroupChat = true;
            } else {
                const otherP = currentChat.participants?.find(p => p.user_id !== user.id);
                chatTitle = `${otherP?.user?.employee?.first_name || ''} ${otherP?.user?.employee?.last_name || ''}`;
                chatSubtitle = "En línea";
            }
        } else {
            chatTitle = currentChat.full_name;
            chatSubtitle = "En línea";
        }
    } else if (view === "newGroup") {
        chatTitle = "Nuevo Grupo";
        chatSubtitle = "Selecciona participantes";
    }

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
                                {view !== "list" && (
                                    <button onClick={handleBack} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                        <ArrowLeft size={20} className="text-slate-500" />
                                    </button>
                                )}
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    {isGroupChat ? <Users size={24} /> : <MessageSquare size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate max-w-[200px]">
                                        {chatTitle}
                                    </h3>
                                    <p className="text-[10px] text-primary font-medium uppercase tracking-wider">
                                        {chatSubtitle}
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
                            
                            {/* --- LIST VIEW --- */}
                            {view === "list" && (
                                <>
                                    {/* Search & Actions */}
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-secondary flex flex-col gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Buscar chat o empleado..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 dark:text-white transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => setView("newGroup")}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors font-medium text-sm"
                                        >
                                            <Plus size={16} /> Nuevo Grupo
                                        </button>
                                    </div>

                                    {/* Combined List */}
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <Loader2 size={32} className="animate-spin mb-2" />
                                                <p className="text-sm">Cargando chats...</p>
                                            </div>
                                        ) : filteredList.length > 0 ? (
                                            filteredList.map((item, idx) => {
                                                let avatarUrl = null;
                                                let itemName = "";
                                                let isGroup = false;
                                                let unreadCount = 0;
                                                let lastMessage = "";
                                                let lastTime = "";

                                                if (item.isChat) {
                                                    unreadCount = item.unreadCount || 0;
                                                    lastMessage = item.messages?.[0]?.message || "Toca para iniciar un chat";
                                                    if (item.messages?.[0]) {
                                                        lastTime = new Date(item.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                    }

                                                    if (item.type === "group") {
                                                        isGroup = true;
                                                        itemName = item.name;
                                                    } else {
                                                        const otherP = item.participants?.find(p => p.user_id !== user.id);
                                                        const empData = otherP?.user?.employee;
                                                        itemName = `${empData?.first_name || ''} ${empData?.last_name || ''}`;
                                                        avatarUrl = empData?.profile_image ? `${API_BASE}${empData.profile_image}` : null;
                                                    }
                                                } else {
                                                    // Empleado nuevo
                                                    itemName = item.full_name;
                                                    avatarUrl = item.profile_image ? `${API_BASE}${item.profile_image}` : null;
                                                    lastMessage = "Nuevo chat";
                                                }

                                                return (
                                                    <button
                                                        key={`item-${idx}`}
                                                        onClick={() => handleSelectChat(item)}
                                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="relative">
                                                            {isGroup ? (
                                                                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 shadow-sm border-2 border-white dark:border-slate-700">
                                                                    <Users size={24} />
                                                                </div>
                                                            ) : avatarUrl ? (
                                                                <img
                                                                    src={avatarUrl}
                                                                    alt={itemName}
                                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 border-2 border-white dark:border-slate-700 shadow-sm">
                                                                    <User size={24} />
                                                                </div>
                                                            )}
                                                            {unreadCount > 0 && (
                                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-secondary">
                                                                    {unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 text-left overflow-hidden">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">
                                                                    {itemName}
                                                                </h4>
                                                                {lastTime && (
                                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                                        {lastTime}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                {lastMessage}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                                <Search size={48} className="mb-4 opacity-20" />
                                                <p className="text-sm">No se encontraron resultados.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* --- NEW GROUP VIEW --- */}
                            {view === "newGroup" && (
                                <div className="flex-1 flex flex-col p-4 bg-white dark:bg-secondary">
                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                            Nombre del Grupo
                                        </label>
                                        <input
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            placeholder="Ej. Clínica Centro"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 dark:text-white transition-all outline-none"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-hidden flex flex-col mb-4">
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                            Seleccionar Participantes ({selectedGroupEmployees.length})
                                        </label>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                            {employees.filter(e => e.user?.id !== user.id).map(emp => {
                                                const isSelected = selectedGroupEmployees.includes(emp.user?.id);
                                                return (
                                                    <label 
                                                        key={`select-${emp.id}`} 
                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                                                            isSelected 
                                                                ? "border-primary bg-primary/5" 
                                                                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        }`}
                                                    >
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 text-primary rounded focus:ring-primary/50 cursor-pointer"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedGroupEmployees([...selectedGroupEmployees, emp.user?.id]);
                                                                } else {
                                                                    setSelectedGroupEmployees(selectedGroupEmployees.filter(id => id !== emp.user?.id));
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            {emp.profile_image ? (
                                                                <img src={`${API_BASE}${emp.profile_image}`} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                                    <User size={16} />
                                                                </div>
                                                            )}
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                                {emp.full_name}
                                                            </span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateGroup}
                                        disabled={!groupName.trim() || selectedGroupEmployees.length === 0 || isCreatingGroup}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCreatingGroup && <Loader2 size={18} className="animate-spin" />}
                                        Crear Grupo
                                    </button>
                                </div>
                            )}

                            {/* --- CHAT VIEW --- */}
                            {view === "chat" && (
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
                                                const isRead = msg.reads && msg.reads.length > 0;
                                                
                                                return (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        key={`msg-${msg.id || 'temp'}-${idx}`}
                                                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                                                    >
                                                        {/* Nombre del sender (si es grupo y no es mío) */}
                                                        {isGroupChat && !isMine && msg.sender?.employee && (
                                                            <span className="text-[10px] text-slate-500 ml-10 mb-1">
                                                                {msg.sender.employee.first_name} {msg.sender.employee.last_name}
                                                            </span>
                                                        )}
                                                        
                                                        <div className={`flex gap-2 max-w-[85%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                                                            {!isMine && (
                                                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 uppercase">
                                                                    {msg.sender?.employee?.first_name?.charAt(0) || 'U'}
                                                                </div>
                                                            )}
                                                            <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                                                                <div className={`p-3 rounded-2xl text-sm shadow-sm relative
                                                                    ${isMine
                                                                        ? "bg-primary text-white rounded-tr-none"
                                                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none"}`}
                                                                >
                                                                    {msg.message}
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-1 mt-1 px-1">
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    
                                                                    {/* Confirmación de Lectura */}
                                                                    {isMine && (
                                                                        <span className="ml-1">
                                                                            {isGroupChat ? (
                                                                                <span className={`text-[9px] ${isRead ? "text-blue-500 font-medium" : "text-slate-400"}`}>
                                                                                    {isRead ? `Visto por ${msg.reads.length}` : <Check size={12} />}
                                                                                </span>
                                                                            ) : (
                                                                                isRead 
                                                                                    ? <CheckCheck size={14} className="text-blue-500" /> 
                                                                                    : <Check size={14} className="text-slate-400" />
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>
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
