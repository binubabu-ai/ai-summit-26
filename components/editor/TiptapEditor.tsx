'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  editable?: boolean;
}

export default function TiptapEditor({
  initialContent = '',
  onChange,
  onSave,
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4 bg-white dark:bg-neutral-950 text-black dark:text-white',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const handleSave = () => {
    if (editor && onSave) {
      onSave(editor.getHTML());
    }
  };

  if (!editor) {
    return <div className="p-4 text-neutral-600 dark:text-neutral-400">Loading editor...</div>;
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950">
      {editable && (
        <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-2 flex flex-wrap gap-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('bold')
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('italic')
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('code')
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            Code
          </button>
          <div className="w-px bg-neutral-200 dark:bg-neutral-800" />
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            H3
          </button>
          <div className="w-px bg-neutral-200 dark:bg-neutral-800" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('bulletList')
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            Bullet List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('orderedList')
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            Numbered List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('codeBlock')
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            Code Block
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('blockquote')
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-white dark:bg-neutral-900 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
            }`}
          >
            Quote
          </button>
          {onSave && (
            <>
              <div className="flex-1" />
              <button
                onClick={handleSave}
                className="px-4 py-1 bg-success text-white rounded text-sm font-medium hover:opacity-90"
              >
                Save
              </button>
            </>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
