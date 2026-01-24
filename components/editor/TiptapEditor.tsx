'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useState, useRef } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Code as CodeIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  FileCode,
  Quote,
  Save as SaveIcon,
  Sparkles,
  ChevronDown,
  Wand2,
  Minimize2,
  Maximize2,
  AlertCircle,
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';

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
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize turndown service for HTML to Markdown conversion
  const turndownService = useMemo(() => new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  }), []);

  // Convert initial markdown content to HTML
  const initialHtml = useMemo(() => {
    if (!initialContent) return '';
    try {
      return marked(initialContent) as string;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return initialContent;
    }
  }, [initialContent]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange?.(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4 bg-white dark:bg-neutral-950 text-black dark:text-white',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent && initialHtml) {
      const currentHtml = editor.getHTML();
      if (initialHtml !== currentHtml) {
        editor.commands.setContent(initialHtml);
      }
    }
  }, [initialContent, initialHtml, editor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAiDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (editor && onSave) {
      setSaving(true);
      try {
        const html = editor.getHTML();
        const markdown = turndownService.turndown(html);
        await onSave(markdown);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAIAction = async (action: string) => {
    if (!editor) return;

    setProcessing(true);
    setShowAiDropdown(false);
    setError(null);

    try {
      // Get selected text or whole document
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, '\n');

      if (!selectedText || selectedText.trim().length === 0) {
        setError('Please select some text to improve');
        return;
      }

      // Get document context (full text for AI reference)
      const documentContext = editor.getText();

      // Call AI API
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          action,
          documentContext,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to improve text');
      }

      const { improvedText } = await response.json();

      // Replace selected text with improved version
      editor.chain().focus().deleteSelection().insertContent(improvedText).run();

      // Clear instruction after successful application
      setAiInstruction('');
    } catch (err) {
      console.error('AI action error:', err);
      setError(err instanceof Error ? err.message : 'Failed to improve text');
    } finally {
      setProcessing(false);
    }
  };

  if (!editor) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  const toolbarButtonClass = (isActive: boolean) =>
    `p-2 rounded-sm transition-all ${
      isActive
        ? 'bg-black dark:bg-white text-white dark:text-black'
        : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
    }`;

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950">
      {editable && (
        <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-2 flex flex-wrap items-center gap-2">
          {/* Text Formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolbarButtonClass(editor.isActive('bold'))}
            title="Bold"
            disabled={processing}
          >
            <BoldIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolbarButtonClass(editor.isActive('italic'))}
            title="Italic"
            disabled={processing}
          >
            <ItalicIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={toolbarButtonClass(editor.isActive('code'))}
            title="Inline Code"
            disabled={processing}
          >
            <CodeIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800" />

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 1 }))}
            title="Heading 1"
            disabled={processing}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 2 }))}
            title="Heading 2"
            disabled={processing}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={toolbarButtonClass(editor.isActive('heading', { level: 3 }))}
            title="Heading 3"
            disabled={processing}
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={toolbarButtonClass(editor.isActive('bulletList'))}
            title="Bullet List"
            disabled={processing}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={toolbarButtonClass(editor.isActive('orderedList'))}
            title="Numbered List"
            disabled={processing}
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-neutral-200 dark:border-neutral-800" />

          {/* Blocks */}
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={toolbarButtonClass(editor.isActive('codeBlock'))}
            title="Code Block"
            disabled={processing}
          >
            <FileCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={toolbarButtonClass(editor.isActive('blockquote'))}
            title="Quote"
            disabled={processing}
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* AI Assistance Dropdown */}
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setShowAiDropdown(!showAiDropdown)}
              className={`p-2 rounded-sm transition-all flex items-center gap-1 ${
                showAiDropdown || processing
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
              }`}
              title="AI Assistance"
              disabled={processing}
            >
              {processing ? (
                <Loader size="sm" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>

            {showAiDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-10">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleAIAction('refine')}
                    className="w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-sm transition-colors flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Refine
                  </button>
                  <button
                    onClick={() => handleAIAction('shorten')}
                    className="w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-sm transition-colors flex items-center gap-2"
                  >
                    <Minimize2 className="w-4 h-4" />
                    Shorten
                  </button>
                  <button
                    onClick={() => handleAIAction('expand')}
                    className="w-full text-left px-3 py-2 text-sm text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-sm transition-colors flex items-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Expand
                  </button>
                  <div className="border-t border-neutral-200 dark:border-neutral-800 my-1" />
                  <div className="p-2">
                    <input
                      type="text"
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && aiInstruction.trim()) {
                          handleAIAction(aiInstruction);
                        }
                      }}
                      placeholder="Custom instruction..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                    <button
                      onClick={() => aiInstruction.trim() && handleAIAction(aiInstruction)}
                      disabled={!aiInstruction.trim()}
                      className="w-full mt-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          {onSave && (
            <>
              <div className="flex-1" />
              <button
                onClick={handleSave}
                disabled={saving || processing}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-sm text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            <span className="text-lg">&times;</span>
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
