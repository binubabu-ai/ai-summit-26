/**
 * Next.js Implementation Template
 * Generates implementation spec for Next.js App Router features
 */

import { Template } from '../types';
import { DocumentType } from '@prisma/client';

export const nextjsImplementationTemplate: Template = {
  id: 'nextjs-implementation',
  name: 'Next.js Implementation Specification',
  category: 'implementation',
  docType: DocumentType.FEATURE_SPEC,
  description: 'Detailed implementation spec for Next.js App Router features',
  requiredTechStack: ['framework'],
  priority: 100,

  applicableWhen: (context) => {
    return context.techStack.framework === 'nextjs';
  },

  template: (context) => {
    const feature = context.features[0];
    if (!feature) return '';

    return `# Next.js Implementation: ${feature.name}

## Overview
${feature.description}

**Complexity**: ${feature.estimatedComplexity || 'moderate'}
**Priority**: ${feature.priority || 'medium'}

---

## Technology Stack
- **Framework**: Next.js (App Router)
- **Language**: ${context.techStack.language || 'TypeScript'}
- **Database**: ${context.techStack.database || 'PostgreSQL'}
- **ORM**: ${context.techStack.orm || 'Prisma'}
- **Auth**: ${context.techStack.auth || 'Supabase Auth'}

---

## File Structure

\`\`\`
app/
├── ${feature.slug}/
│   ├── page.tsx                 # Main feature page
│   ├── layout.tsx               # Feature-specific layout
│   ├── loading.tsx              # Loading state
│   └── error.tsx                # Error boundary
├── api/
│   └── ${feature.slug}/
│       └── route.ts             # API route handler
components/
└── ${feature.slug}/
    ├── ${feature.name}Form.tsx  # Main form component
    ├── ${feature.name}List.tsx  # List/table component
    └── ${feature.name}Card.tsx  # Individual item card
lib/
├── actions/
│   └── ${feature.slug}.ts       # Server actions
└── validations/
    └── ${feature.slug}.ts       # Validation schemas
\`\`\`

---

## Requirements

${feature.requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

---

## Implementation Steps

### Step 1: Database Schema

Create Prisma model(s):

\`\`\`prisma
// Add to prisma/schema.prisma

model ${capitalize(camelCase(feature.name))} {
  id        String   @id @default(cuid())
  // TODO: Add fields based on requirements
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("${feature.slug.replace(/-/g, '_')}")
}
\`\`\`

Run migration:
\`\`\`bash
npx prisma migrate dev --name add_${feature.slug.replace(/-/g, '_')}
\`\`\`

### Step 2: Validation Schema

Create validation using Zod:

\`\`\`typescript
// lib/validations/${feature.slug}.ts

import { z } from 'zod';

export const ${camelCase(feature.name)}Schema = z.object({
  // TODO: Add validation rules based on requirements
});

export type ${capitalize(camelCase(feature.name))}Input = z.infer<typeof ${camelCase(feature.name)}Schema>;
\`\`\`

### Step 3: Server Actions

Create server actions:

\`\`\`typescript
// lib/actions/${feature.slug}.ts

'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { ${camelCase(feature.name)}Schema } from '@/lib/validations/${feature.slug}';

export async function create${capitalize(camelCase(feature.name))}(data: FormData) {
  // TODO: Implement create action
}

export async function update${capitalize(camelCase(feature.name))}(id: string, data: FormData) {
  // TODO: Implement update action
}

export async function delete${capitalize(camelCase(feature.name))}(id: string) {
  // TODO: Implement delete action
}
\`\`\`

### Step 4: API Routes (if needed for external access)

\`\`\`typescript
// app/api/${feature.slug}/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // TODO: Implement GET handler
}

export async function POST(request: NextRequest) {
  // TODO: Implement POST handler
}
\`\`\`

### Step 5: UI Components

Create main page component:

\`\`\`typescript
// app/${feature.slug}/page.tsx

import { ${capitalize(camelCase(feature.name))}Form } from '@/components/${feature.slug}/${feature.name}Form';
import { ${capitalize(camelCase(feature.name))}List } from '@/components/${feature.slug}/${feature.name}List';

export default async function ${capitalize(camelCase(feature.name))}Page() {
  // TODO: Fetch data

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">${feature.name}</h1>
      <${capitalize(camelCase(feature.name))}Form />
      <${capitalize(camelCase(feature.name))}List />
    </div>
  );
}
\`\`\`

---

## Testing Requirements

### Unit Tests
- [ ] Validation schema tests
- [ ] Server action tests (mocked DB)
- [ ] Component rendering tests

### Integration Tests
- [ ] API route tests with test database
- [ ] Form submission flow
- [ ] CRUD operations end-to-end

### E2E Tests
- [ ] User can create ${feature.name.toLowerCase()}
- [ ] User can view ${feature.name.toLowerCase()} list
- [ ] User can edit ${feature.name.toLowerCase()}
- [ ] User can delete ${feature.name.toLowerCase()}

---

## Security Considerations

${context.constraints
  .filter(c => c.type === 'security')
  .map(c => `- **${c.category}**: ${c.rules.join(', ')}`)
  .join('\n') || '- [ ] Add authentication checks\n- [ ] Validate user permissions\n- [ ] Sanitize inputs'}

---

## Performance Considerations

${context.constraints
  .filter(c => c.type === 'performance')
  .map(c => `- **${c.category}**: ${c.rules.join(', ')}`)
  .join('\n') || '- [ ] Add pagination for lists\n- [ ] Implement caching where appropriate\n- [ ] Optimize database queries'}

---

## Rollout Plan

1. **Development**
   - [ ] Implement database schema
   - [ ] Create server actions
   - [ ] Build UI components
   - [ ] Add tests

2. **Testing**
   - [ ] Run all tests
   - [ ] Manual QA
   - [ ] Security review

3. **Deployment**
   - [ ] Run migrations on staging
   - [ ] Deploy to staging
   - [ ] Smoke test
   - [ ] Deploy to production
   - [ ] Monitor for errors

---

## Dependencies

- Existing auth system
- Database connection
${context.constraints
  .filter(c => c.type === 'technical')
  .map(c => `- ${c.category}`)
  .join('\n')}

---

## Notes

<!-- Add implementation notes, gotchas, and decisions here -->

**Generated from**: ${context.sourcePath}
**Template**: nextjs-implementation
**Generated on**: ${new Date().toISOString().split('T')[0]}
`;
  }
};

// Helper functions
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^./, chr => chr.toLowerCase());
}
