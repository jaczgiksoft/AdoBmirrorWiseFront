import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon,
    Unlink,
    RemoveFormatting
} from 'lucide-react';

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const addLink = () => {
        const url = window.prompt('URL');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const items = [
        {
            icon: Bold,
            title: 'Negrita',
            action: () => editor.chain().focus().toggleBold().run(),
            isActive: () => editor.isActive('bold'),
        },
        {
            icon: Italic,
            title: 'Cursiva',
            action: () => editor.chain().focus().toggleItalic().run(),
            isActive: () => editor.isActive('italic'),
        },
        {
            icon: UnderlineIcon,
            title: 'Subrayado',
            action: () => editor.chain().focus().toggleUnderline().run(),
            isActive: () => editor.isActive('underline'),
        },
        {
            type: 'divider',
        },
        {
            icon: List,
            title: 'Lista con viñetas',
            action: () => editor.chain().focus().toggleBulletList().run(),
            isActive: () => editor.isActive('bulletList'),
        },
        {
            icon: ListOrdered,
            title: 'Lista numerada',
            action: () => editor.chain().focus().toggleOrderedList().run(),
            isActive: () => editor.isActive('orderedList'),
        },
        {
            type: 'divider',
        },
        {
            icon: LinkIcon,
            title: 'Enlace',
            action: addLink,
            isActive: () => editor.isActive('link'),
        },
        {
            icon: Unlink,
            title: 'Quitar enlace',
            action: () => editor.chain().focus().unsetLink().run(),
        },
        {
            type: 'divider',
        },
        {
            icon: RemoveFormatting,
            title: 'Limpiar formato',
            action: () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
        },
    ];

    return (
        <div className="flex flex-wrap gap-1 p-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            {items.map((item, index) => (
                item.type === 'divider' ? (
                    <div key={index} className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 self-center" />
                ) : (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.preventDefault();
                            item.action();
                        }}
                        className={`
                            p-1.5 rounded-md transition-colors
                            ${item.isActive && item.isActive()
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}
                        `}
                        title={item.title}
                    >
                        <item.icon size={14} />
                    </button>
                )
            ))}
        </div>
    );
};

const BwiseRichTextEditor = ({ value, onChange, placeholder = 'Escribir notas...' }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange({
                json: editor.getJSON(),
                html: editor.getHTML()
            });
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] p-3 text-sm text-slate-700 dark:text-slate-200 tiptap-editor-content',
            },
        },
    });

    // Update content if value changes from outside (and it's different)
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div className="
            w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden
            focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all
            bg-white dark:bg-slate-800
        ">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default BwiseRichTextEditor;
