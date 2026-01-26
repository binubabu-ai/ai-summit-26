'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DocumentNode } from '@/lib/utils/document-tree';
import { Badge } from '@/components/ui/badge';
import { DocumentActionMenu } from './DocumentActionMenu';
import { FileText, Folder, ChevronRight } from 'lucide-react';

interface DocumentTreeProps {
  nodes: DocumentNode[];
  projectSlug: string;
  level?: number;
  onUpdate?: () => void;
}

function TreeNode({
  node,
  projectSlug,
  level = 0,
  onUpdate,
}: {
  node: DocumentNode;
  projectSlug: string;
  level?: number;
  onUpdate?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(level === 0); // Auto-expand root level

  if (node.type === 'file') {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors group"
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <Link
          href={`/projects/${projectSlug}/docs/${node.path}`}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="flex-1 text-black dark:text-white truncate">{node.name}</span>
        </Link>

        {/* Grounding Badge */}
        {node.groundingState && node.groundingState === 'grounded' && (
          <Badge variant="success" size="sm">
            Grounded
          </Badge>
        )}
        {node.groundingState && node.groundingState === 'ungrounded' && (
          <Badge variant="neutral" size="sm">
            Ungrounded
          </Badge>
        )}

        {/* Module Count Badge */}
        {node.moduleCount !== undefined && node.moduleCount > 0 && (
          <Badge variant="neutral" size="sm">
            •{node.moduleCount}
          </Badge>
        )}

        {/* Conflict Badge */}
        {node.conflictCount !== undefined && node.conflictCount > 0 && (
          <Badge variant="warning" size="sm">
            {node.conflictCount} Conflict{node.conflictCount > 1 ? 's' : ''}
          </Badge>
        )}

        {/* Updated Date */}
        {node.updatedAt && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {new Date(node.updatedAt).toLocaleDateString()}
          </span>
        )}

        {/* Action Menu (visible on hover) */}
        {node.docId && node.groundingState && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DocumentActionMenu
              documentId={node.docId}
              documentPath={node.path}
              groundingState={node.groundingState}
              moduleCount={node.moduleCount || 0}
              conflictCount={node.conflictCount || 0}
              projectSlug={projectSlug}
              onUpdate={onUpdate || (() => {})}
            />
          </div>
        )}
      </div>
    );
  }

  // Folder
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors w-full text-left"
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <ChevronRight className={`w-4 h-4 text-amber-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
        <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="flex-1 font-medium text-black dark:text-white">{node.name}</span>
        {node.children && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {node.children.length}
          </span>
        )}
      </button>
      {isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.path || idx}
              node={child}
              projectSlug={projectSlug}
              level={level + 1}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentTree({ nodes, projectSlug, level = 0, onUpdate }: DocumentTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
        No documents yet. Create your first document to get started!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node, idx) => (
        <TreeNode
          key={node.path || idx}
          node={node}
          projectSlug={projectSlug}
          level={level}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
