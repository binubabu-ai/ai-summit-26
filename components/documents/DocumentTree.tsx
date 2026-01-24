'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DocumentNode } from '@/lib/utils/document-tree';

interface DocumentTreeProps {
  nodes: DocumentNode[];
  projectSlug: string;
  level?: number;
}

function TreeNode({
  node,
  projectSlug,
  level = 0,
}: {
  node: DocumentNode;
  projectSlug: string;
  level?: number;
}) {
  const [isOpen, setIsOpen] = useState(level === 0); // Auto-expand root level

  if (node.type === 'file') {
    return (
      <Link
        href={`/projects/${projectSlug}/docs/${node.path}`}
        className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <span className="text-blue-500">📄</span>
        <span className="flex-1">{node.name}</span>
        {node.updatedAt && (
          <span className="text-xs text-neutral-500">
            {new Date(node.updatedAt).toLocaleDateString()}
          </span>
        )}
      </Link>
    );
  }

  // Folder
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors w-full text-left"
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <span className="text-amber-500 transition-transform" style={{
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>
          ▶
        </span>
        <span className="text-amber-500">📁</span>
        <span className="flex-1 font-medium">{node.name}</span>
        {node.children && (
          <span className="text-xs text-neutral-500">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentTree({ nodes, projectSlug, level = 0 }: DocumentTreeProps) {
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
        />
      ))}
    </div>
  );
}
