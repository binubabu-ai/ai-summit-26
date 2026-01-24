'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DiffPreview } from './DiffPreview';
import { Send, Sparkles, Loader2, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Suggestion[];
  createdAt: string;
}

interface Suggestion {
  id?: string;
  type: string;
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  reasoning: string;
  confidence: number;
}

interface DocChatProps {
  documentId: string;
  documentContent: string;
  selectedText?: string;
  onApplySuggestion: (newContent: string) => void;
}

export function DocChat({
  documentId,
  documentContent,
  selectedText,
  onApplySuggestion,
}: DocChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history
  useEffect(() => {
    loadChatHistory();
  }, [documentId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const res = await fetch(`/api/ai/chat?documentId=${documentId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message optimistically
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          message: userMessage,
          selectedText,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();

      // Add AI response
      const aiMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: data.message,
        suggestions: data.suggestions,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== tempMessage.id), tempMessage, aiMessage]);
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message. Please try again.');
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!selectedText || loading) {
      alert('Please select some text first');
      return;
    }

    setLoading(true);

    const actions: Record<string, string> = {
      concise: 'Make this more concise',
      clarity: 'Improve clarity',
      examples: 'Add examples',
      grammar: 'Fix grammar',
      simplify: 'Simplify this',
    };

    const userMessage = actions[action] || 'Improve this text';

    // Add user message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          message: userMessage,
          quickAction: action,
          selectedText,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to process quick action');
      }

      const data = await res.json();

      const aiMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: data.message,
        suggestions: data.suggestions,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== tempMessage.id), tempMessage, aiMessage]);
    } catch (error) {
      console.error('Quick action error:', error);
      alert('Failed to process request. Please try again.');
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestion: Suggestion) => {
    if (!suggestion.id) return;

    setApplyingId(suggestion.id);

    try {
      const res = await fetch(`/api/ai/suggestions/${suggestion.id}/apply`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to apply suggestion');
      }

      const data = await res.json();
      onApplySuggestion(data.newContent);

      alert('✅ Suggestion applied successfully!');
    } catch (error) {
      console.error('Apply suggestion error:', error);
      alert('Failed to apply suggestion. Please try again.');
    } finally {
      setApplyingId(null);
    }
  };

  const handleRejectSuggestion = async (suggestion: Suggestion) => {
    if (!suggestion.id) return;

    try {
      const res = await fetch(`/api/ai/suggestions/${suggestion.id}/apply`, {
        method: 'PATCH',
      });

      if (res.ok) {
        // Remove suggestion from UI
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            suggestions: msg.suggestions?.filter((s) => s.id !== suggestion.id),
          }))
        );
      }
    } catch (error) {
      console.error('Reject suggestion error:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isCollapsed) {
    return (
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          onClick={() => setIsCollapsed(false)}
          className="rounded-full w-14 h-14 shadow-lg"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black dark:text-white" />
            <h3 className="text-lg font-light text-black dark:text-white">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {selectedText && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Text selected • Quick actions:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleQuickAction('concise')}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                ✂️ Concise
              </Button>
              <Button
                onClick={() => handleQuickAction('clarity')}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                💡 Clarity
              </Button>
              <Button
                onClick={() => handleQuickAction('examples')}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                📊 Examples
              </Button>
              <Button
                onClick={() => handleQuickAction('grammar')}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                ✅ Grammar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Ask me anything about this document
            </p>
            <div className="space-y-2 text-xs text-neutral-500 dark:text-neutral-600">
              <p>• "Make the intro more concise"</p>
              <p>• "Add examples to this section"</p>
              <p>• "Improve clarity"</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* Message bubble */}
              <div
                className={`${
                  message.role === 'user'
                    ? 'bg-black dark:bg-white text-white dark:text-black ml-8'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white mr-8'
                } p-3 rounded-lg`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="space-y-3 mr-8">
                  {message.suggestions.map((suggestion, index) => (
                    <DiffPreview
                      key={index}
                      original={suggestion.originalText}
                      suggested={suggestion.suggestedText}
                      title={suggestion.title}
                      reasoning={suggestion.reasoning}
                      confidence={suggestion.confidence}
                      onApply={() => handleApplySuggestion(suggestion)}
                      onReject={() => handleRejectSuggestion(suggestion)}
                      isApplying={applyingId === suggestion.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm">AI is thinking...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to improve this document..."
            className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-950 text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
            rows={2}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            variant="primary"
            size="sm"
            disabled={!input.trim() || loading}
            className="self-end"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-2">
          Press Cmd/Ctrl + Enter to send
        </p>
      </div>
    </div>
  );
}
