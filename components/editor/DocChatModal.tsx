'use client';

import { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { DocChat } from './DocChat';

interface DocChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentContent: string;
  onApplySuggestion: (newContent: string) => void;
}

export function DocChatModal({
  isOpen,
  onClose,
  documentId,
  documentContent,
  onApplySuggestion,
}: DocChatModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed z-50 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl transition-all duration-200 ${
          isMinimized
            ? 'bottom-6 right-6 w-80 h-16'
            : 'bottom-6 right-6 w-[600px] h-[600px] md:w-[600px] md:h-[600px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h3 className="font-medium text-black dark:text-white">
              AI Document Assistant
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="h-[calc(100%-64px)]">
            <DocChat
              documentId={documentId}
              documentContent={documentContent}
              onApplySuggestion={onApplySuggestion}
            />
          </div>
        )}
      </div>
    </>
  );
}
