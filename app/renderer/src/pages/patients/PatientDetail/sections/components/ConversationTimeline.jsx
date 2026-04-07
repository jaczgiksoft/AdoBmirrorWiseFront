import React from 'react';

import ConversationEntry from './ConversationEntry';
import { MessageSquare } from 'lucide-react';

export default function ConversationTimeline({ conversations, onEdit, onDelete }) {
    const hasConversations = conversations && conversations.length > 0;

    // Explicit sort: Newest first (createdAt DESC) 
    const sortedConversations = React.useMemo(() => {
        if (!hasConversations) return [];
        return [...conversations].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
        });
    }, [conversations, hasConversations]);

    if (!hasConversations) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-400 dark:text-slate-500">
                    <MessageSquare size={24} />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    No hay historial de conversaciones
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                    Este paciente no tiene registros de seguimiento o conversaciones clínicas aún.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-secondary border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/50">
                {sortedConversations.map(conv => (
                    <ConversationEntry
                        key={conv.id}
                        conversation={conv}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}

