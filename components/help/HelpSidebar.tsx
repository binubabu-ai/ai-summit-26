'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const HELP_SECTIONS = [
  {
    title: 'Getting Started',
    items: [
      { href: '/help/getting-started', label: 'Quick Start' },
      { href: '/help/getting-started/first-project', label: 'Create Your First Project' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { href: '/help/guides/projects', label: 'Project Management' },
      { href: '/help/guides/documents', label: 'Document Management' },
      { href: '/help/guides/revisions', label: 'Version Control & Revisions' },
      { href: '/help/guides/ai-features', label: 'AI Assistant Features' },
      { href: '/help/guides/audit', label: 'Audit & Compliance' },
    ],
  },
  {
    title: 'API & Integration',
    items: [
      { href: '/help/api', label: 'API Overview' },
      { href: '/help/api/mcp', label: 'MCP Integration' },
      { href: '/help/api/rest', label: 'REST API Reference' },
      { href: '/help/cli', label: 'CLI Tools' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { href: '/help/faq', label: 'Frequently Asked Questions' },
      { href: '/help/troubleshooting', label: 'Troubleshooting' },
      { href: '/help/support', label: 'Get Support' },
    ],
  },
];

export function HelpSidebar() {
  const pathname = usePathname();

  return (
    <nav className="p-6 space-y-8">
      <div>
        <Link
          href="/help"
          className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Help Center
        </Link>
      </div>

      {HELP_SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="font-semibold text-sm text-foreground mb-3">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block px-3 py-2 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
