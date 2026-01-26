'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ModuleListModal } from './ModuleListModal';
import { ConflictListModal } from './ConflictListModal';
import { AlertTriangle } from 'lucide-react';

interface DocumentActionMenuProps {
  documentId: string;
  documentPath: string;
  groundingState: 'ungrounded' | 'grounded' | 'deprecated';
  moduleCount: number;
  conflictCount: number;
  projectSlug: string;
  onUpdate: () => void;
}

export function DocumentActionMenu({
  documentId,
  documentPath,
  groundingState,
  moduleCount,
  conflictCount,
  projectSlug,
  onUpdate,
}: DocumentActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [toggling, setToggling] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleViewModules = () => {
    setShowModuleModal(true);
    setIsOpen(false);
  };

  const handleViewConflicts = () => {
    setShowConflictModal(true);
    setIsOpen(false);
  };

  const handleToggleGrounding = async () => {
    setToggling(true);
    setIsOpen(false);

    try {
      // Fetch all modules for this document
      const modulesRes = await fetch(
        `/api/projects/${projectSlug}/knowledge/modules?documentId=${documentId}`
      );

      if (!modulesRes.ok) {
        console.error('Failed to fetch modules');
        return;
      }

      const { modules } = await modulesRes.json();
      const action = groundingState === 'grounded' ? 'unground' : 'ground';

      // Toggle all modules
      await Promise.all(
        modules.map((module: any) =>
          fetch(`/api/projects/${projectSlug}/knowledge/modules/${module.id}/ground`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          })
        )
      );

      onUpdate();
    } catch (error) {
      console.error('Failed to toggle grounding:', error);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
      >
        •••
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50">
          <button
            onClick={handleViewModules}
            className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors first:rounded-t-lg flex items-center justify-between"
            disabled={moduleCount === 0}
          >
            <div>
              <div className="font-medium text-black dark:text-white">View Modules</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {moduleCount} module{moduleCount !== 1 ? 's' : ''}
              </div>
            </div>
            {moduleCount > 0 && (
              <Badge variant="neutral" size="sm">
                •{moduleCount}
              </Badge>
            )}
          </button>

          <button
            onClick={handleViewConflicts}
            className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between"
            disabled={conflictCount === 0}
          >
            <div>
              <div className="font-medium text-black dark:text-white">View Conflicts</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
              </div>
            </div>
            {conflictCount > 0 && (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {conflictCount}
              </Badge>
            )}
          </button>

          <button
            onClick={handleToggleGrounding}
            disabled={toggling || moduleCount === 0}
            className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-t border-neutral-200 dark:border-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-medium text-black dark:text-white">
              {toggling
                ? 'Updating...'
                : groundingState === 'grounded'
                ? 'Unground Document'
                : 'Ground Document'}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {toggling
                ? 'Please wait'
                : groundingState === 'grounded'
                ? 'Remove from MCP context'
                : 'Make available to AI agents'}
            </div>
          </button>

          <button
            onClick={() => {
              window.location.href = `/projects/${projectSlug}/docs/${documentPath}`;
            }}
            className="w-full text-left px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-t border-neutral-200 dark:border-neutral-800 last:rounded-b-lg"
          >
            <div className="font-medium text-black dark:text-white">Open Document</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">View and edit content</div>
          </button>
        </div>
      )}

      {/* Module List Modal */}
      {showModuleModal && (
        <ModuleListModal
          documentId={documentId}
          documentPath={documentPath}
          projectSlug={projectSlug}
          onClose={() => setShowModuleModal(false)}
          onUpdate={onUpdate}
        />
      )}

      {/* Conflict List Modal */}
      {showConflictModal && (
        <ConflictListModal
          documentId={documentId}
          documentPath={documentPath}
          projectSlug={projectSlug}
          onClose={() => setShowConflictModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
