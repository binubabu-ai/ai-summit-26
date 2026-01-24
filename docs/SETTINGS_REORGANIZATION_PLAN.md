# Settings Page Reorganization Plan

## Current Issues

1. **Navigation Friction**: Users have to navigate to a separate page for integration guides
2. **Poor Information Architecture**: API Keys and MCP are buried under Settings
3. **Developer Experience**: Developers need quick access to API configuration
4. **Discoverability**: Important integrations are hidden in a settings tab

## Proposed Solution

### New Project Navigation Structure

Instead of only having "Settings" in the project navigation, add three top-level tabs:

```
Project Detail Page Navigation:
┌─────────────┬──────────────┬────────┬──────────┐
│  Overview   │  API & MCP   │  Team  │ Settings │
└─────────────┴──────────────┴────────┴──────────┘
```

### Navigation Breakdown

#### 1. Overview Tab (Default)
- **Route**: `/projects/[slug]`
- **Content**:
  - Project info (name, description)
  - Document tree
  - Recent activity
  - Quick stats (documents, team size, API calls)

#### 2. API & MCP Tab (New)
- **Route**: `/projects/[slug]/integrations`
- **Sections**:

  **API Keys Section**:
  - List of API keys with creation date, last used
  - Create new API key button
  - Inline integration guide (NO navigation required)
    - Code examples
    - Quick start guide
    - Authentication flow
    - Rate limits
    - Example requests

  **MCP Integration Section**:
  - MCP configuration display
  - Download JSON button
  - Inline setup guides (NO navigation required) with expandable sections:
    - Claude Desktop setup
    - Cursor setup
    - Custom MCP setup
    - Code examples for each
    - Troubleshooting

#### 3. Team Tab (New)
- **Route**: `/projects/[slug]/team`
- **Content**:
  - Team members list (moved from Settings)
  - Add members functionality
  - Role management
  - Permissions overview

#### 4. Settings Tab (Simplified)
- **Route**: `/projects/[slug]/settings`
- **Content** (Owner only):
  - Project name/slug/description
  - Visibility settings
  - Danger zone (delete project)
  - Advanced settings

## Implementation Details

### 1. Navigation Component Structure

```typescript
// components/project/ProjectNav.tsx
interface ProjectNavProps {
  slug: string;
  currentTab: 'overview' | 'integrations' | 'team' | 'settings';
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: Home, href: `/projects/${slug}` },
  { id: 'integrations', label: 'API & MCP', icon: Plug, href: `/projects/${slug}/integrations` },
  { id: 'team', label: 'Team', icon: Users, href: `/projects/${slug}/team` },
  { id: 'settings', label: 'Settings', icon: Settings, href: `/projects/${slug}/settings` },
];
```

### 2. Integration Guides Component

```typescript
// components/integrations/IntegrationGuide.tsx
interface Guide {
  id: string;
  title: string;
  description: string;
  steps: Step[];
  codeExamples: CodeExample[];
}

// Expandable accordion-style sections
// Copy-to-clipboard buttons for code
// Syntax highlighting
// Live API key interpolation in examples
```

### 3. File Structure

```
app/
  projects/
    [slug]/
      page.tsx              # Overview (document tree)
      integrations/
        page.tsx            # API Keys + MCP with guides
      team/
        page.tsx            # Team management
      settings/
        page.tsx            # Project settings (simplified)

components/
  project/
    ProjectNav.tsx          # Top-level navigation
  integrations/
    ApiKeysSection.tsx      # API keys with inline guide
    McpSection.tsx          # MCP config with inline guides
    IntegrationGuide.tsx    # Reusable guide component
    CodeBlock.tsx           # Code example with copy button
  team/
    TeamSection.tsx         # Team management UI
```

### 4. API Keys Section Design

```
┌─────────────────────────────────────────────────────┐
│ API Keys                                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ vx_***************abc  Created: 2 days ago   │   │
│ │ Last used: 1 hour ago             [Delete]   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [+ Create New API Key]                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Integration Guide                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ▼ Quick Start                                       │
│   1. Create an API key above                        │
│   2. Add to your .env file                          │
│   3. Make authenticated requests                    │
│                                                     │
│   [Copy Code Example]                               │
│   ┌───────────────────────────────────────────┐   │
│   │ DOCJAYS_API_KEY=vx_your_key_here          │   │
│   └───────────────────────────────────────────┘   │
│                                                     │
│ ▼ Authentication                                    │
│   All API requests require Bearer token...          │
│   [Copy Example]                                    │
│   ┌───────────────────────────────────────────┐   │
│   │ curl https://docjays.vercel.app/api/... \ │   │
│   │   -H "Authorization: Bearer $API_KEY"      │   │
│   └───────────────────────────────────────────┘   │
│                                                     │
│ ▼ Available Endpoints                               │
│   GET  /api/documents                               │
│   POST /api/documents                               │
│   [View Full API Reference]                         │
└─────────────────────────────────────────────────────┘
```

### 5. MCP Section Design

```
┌─────────────────────────────────────────────────────┐
│ MCP Integration                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ MCP Endpoint:                                       │
│ https://docjays.vercel.app/api/mcp                  │
│ [Copy] [Download JSON]                              │
│                                                     │
│ Your API Key: vx_***************abc [Show]         │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Setup Guides                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ▼ Claude Desktop                                    │
│   1. Open Claude Desktop settings                   │
│   2. Navigate to Developer settings                 │
│   3. Add MCP server configuration                   │
│                                                     │
│   [Copy Configuration]                              │
│   ┌───────────────────────────────────────────┐   │
│   │ {                                         │   │
│   │   "mcpServers": {                         │   │
│   │     "docjays": {                          │   │
│   │       "url": "https://docjays...",         │   │
│   │       "headers": {                        │   │
│   │         "Authorization": "Bearer vx_..."   │   │
│   │       }                                   │   │
│   │     }                                     │   │
│   │   }                                       │   │
│   │ }                                         │   │
│   └───────────────────────────────────────────┘   │
│                                                     │
│ ▼ Cursor                                            │
│   Step-by-step Cursor setup...                      │
│   [Copy Configuration]                              │
│   [Code example]                                    │
│                                                     │
│ ▼ Custom Integration                                │
│   For other tools and editors...                    │
│                                                     │
│ ▼ Available Commands                                │
│   • list_documents                                  │
│   • read_document                                   │
│   • create_revision                                 │
│   [View Full MCP Documentation]                     │
└─────────────────────────────────────────────────────┘
```

## Benefits

### User Experience
- **Faster Access**: API configuration is 1 click away from project overview
- **No Context Switching**: All guides are inline, no navigation required
- **Better Discoverability**: Integrations are promoted to top-level
- **Logical Grouping**: Related features grouped together

### Developer Experience
- **Quick Setup**: Copy-paste configurations directly
- **Live Examples**: API key automatically inserted in code examples
- **Progressive Disclosure**: Expand only sections you need
- **Clear Hierarchy**: Easy to find what you need

### Information Architecture
```
Before:
Projects → [slug] → Settings → API Keys Tab → Navigate to docs

After:
Projects → [slug] → API & MCP → Everything in one place
```

## Migration Plan

### Phase 1: Create New Routes
1. Create `/integrations` page
2. Create `/team` page
3. Keep `/settings` but remove API Keys and Team sections

### Phase 2: Build Components
1. `ProjectNav` - Top-level navigation
2. `ApiKeysSection` with inline guides
3. `McpSection` with inline guides
4. `IntegrationGuide` - Reusable expandable guide
5. `CodeBlock` - Copy-to-clipboard code examples

### Phase 3: Content Migration
1. Move API keys from settings to integrations
2. Move MCP config from settings to integrations
3. Move team management from settings to team tab
4. Simplify settings page

### Phase 4: Polish
1. Add transitions and animations
2. Add keyboard shortcuts (j/k for navigation)
3. Add search within guides
4. Add "Recently viewed" section

## Code Examples

### ProjectNav Component

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plug, Users, Settings } from 'lucide-react';

export function ProjectNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home, href: `/projects/${slug}` },
    { id: 'integrations', label: 'API & MCP', icon: Plug, href: `/projects/${slug}/integrations` },
    { id: 'team', label: 'Team', icon: Users, href: `/projects/${slug}/team` },
    { id: 'settings', label: 'Settings', icon: Settings, href: `/projects/${slug}/settings` },
  ];

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href ||
              (tab.id === 'overview' && pathname === `/projects/${slug}`);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
```

### IntegrationGuide Component

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface GuideSection {
  title: string;
  description: string;
  code?: {
    language: string;
    content: string;
  };
}

export function IntegrationGuide({ sections }: { sections: GuideSection[] }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const copyCode = async (index: number, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied((prev) => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setCopied((prev) => ({ ...prev, [index]: false }));
    }, 2000);
  };

  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <div key={index} className="border border-neutral-200 dark:border-neutral-800 rounded-sm">
          <button
            onClick={() => toggleSection(index)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expanded[index] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="font-medium text-black dark:text-white">
                {section.title}
              </span>
            </div>
          </button>

          {expanded[index] && (
            <div className="px-4 pb-4 space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {section.description}
              </p>

              {section.code && (
                <div className="relative">
                  <pre className="bg-neutral-900 dark:bg-black text-neutral-100 dark:text-neutral-300 p-4 rounded-sm text-sm overflow-x-auto">
                    <code>{section.code.content}</code>
                  </pre>
                  <button
                    onClick={() => copyCode(index, section.code!.content)}
                    className="absolute top-2 right-2 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-sm transition-colors"
                  >
                    {copied[index] ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Testing Checklist

- [ ] All navigation links work correctly
- [ ] Active tab highlighting works
- [ ] Expandable sections open/close smoothly
- [ ] Copy-to-clipboard works for all code examples
- [ ] API key is correctly interpolated in code examples
- [ ] Mobile responsive design
- [ ] Keyboard navigation works
- [ ] Dark mode looks good
- [ ] No broken links
- [ ] Fast page transitions

## Success Metrics

- **Time to first API call**: Reduced from 5+ minutes to < 2 minutes
- **Support tickets**: Reduced integration-related tickets by 70%
- **User satisfaction**: Increase integration setup satisfaction score
- **API adoption**: Increase % of projects with API keys created

## Future Enhancements

1. **Interactive Playground**: Test API calls directly in the UI
2. **Webhooks Section**: Add webhook configuration and testing
3. **Usage Analytics**: Show API usage graphs and limits
4. **SDK Downloads**: Quick links to client SDKs
5. **Video Tutorials**: Embed setup videos
6. **Community Integrations**: Showcase community-built integrations
