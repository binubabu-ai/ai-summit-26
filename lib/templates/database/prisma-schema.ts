/**
 * Prisma Schema Template
 * Generates database schema specification
 */

import { Template } from '../types';
import { DocumentType } from '@prisma/client';

export const prismaSchemaTemplate: Template = {
  id: 'prisma-schema',
  name: 'Prisma Database Schema Specification',
  category: 'database',
  docType: DocumentType.ARCHITECTURE,
  description: 'Database schema design using Prisma ORM',
  requiredTechStack: ['orm', 'database'],
  priority: 95,

  applicableWhen: (context) => {
    return context.techStack.orm === 'prisma';
  },

  template: (context) => {
    const hasFeatures = context.features.length > 0;

    return `# Database Schema Specification

## Overview
Database schema design for ${context.projectName || 'the project'}.

**ORM**: Prisma
**Database**: ${context.techStack.database || 'PostgreSQL'}
**Design Approach**: Feature-based data modeling

---

## Database Models

${hasFeatures ? context.features.map(feature => `
### ${capitalize(feature.name)} Model

**Purpose**: ${feature.description}

\`\`\`prisma
model ${toPascalCase(feature.slug)} {
  id        String   @id @default(cuid())

  // Core fields (to be refined based on requirements)
  // TODO: Add specific fields for ${feature.name}

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  // TODO: Add relations to other models

  @@index([createdAt])
  @@map("${toSnakeCase(feature.slug)}")
}
\`\`\`

**Requirements Mapping**:
${feature.requirements.map(req => `- ${req}`).join('\n')}

`).join('\n---\n') : `
### Example Model Structure

\`\`\`prisma
model Example {
  id        String   @id @default(cuid())
  // Add fields here
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("examples")
}
\`\`\`
`}

---

## Database Relationships

### Entity Relationship Diagram

\`\`\`
[Generate ERD based on final schema]
\`\`\`

### Relationship Types

${hasFeatures ? '- **One-to-Many**: (Define after schema refinement)\n- **Many-to-Many**: (Define after schema refinement)\n- **One-to-One**: (Define after schema refinement)' : '- Define relationships based on feature requirements'}

---

## Indexes

**Performance Optimization Strategy**:

${hasFeatures ? context.features.map(f =>
  `- **${f.name}**: Index on frequently queried fields (createdAt, status, etc.)`
).join('\n') : '- Add indexes on foreign keys\n- Add indexes on frequently filtered fields\n- Add composite indexes for common query patterns'}

---

## Data Validation

### Database Constraints

${context.constraints
  .filter(c => c.type === 'validation')
  .map(c => `
**${c.category}**:
${c.rules.map(rule => `- ${rule}`).join('\n')}
`).join('\n') || `
- NOT NULL constraints on required fields
- UNIQUE constraints where appropriate
- CHECK constraints for data integrity
- Foreign key constraints for referential integrity
`}

### Application-Level Validation

Use Zod schemas in conjunction with Prisma models:

\`\`\`typescript
import { z } from 'zod';

// Define validation schemas in lib/validations/
\`\`\`

---

## Migration Strategy

### Initial Migration

\`\`\`bash
# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
\`\`\`

### Future Migrations

1. Update \`schema.prisma\`
2. Run \`npx prisma migrate dev --name <descriptive_name>\`
3. Review generated SQL
4. Test migration on development database
5. Deploy to staging
6. Deploy to production

### Rollback Plan

\`\`\`bash
# Revert last migration
npx prisma migrate resolve --rolled-back <migration_name>
\`\`\`

---

## Data Seeding

Create seed script for development:

\`\`\`typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed data for ${hasFeatures ? context.features[0].name : 'models'}

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
\`\`\`

Add to \`package.json\`:
\`\`\`json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
\`\`\`

---

## Performance Considerations

### Query Optimization

${context.constraints
  .filter(c => c.type === 'performance')
  .map(c => `- **${c.category}**: ${c.rules.join(', ')}`)
  .join('\n') || `
- Use \`select\` to return only needed fields
- Use \`include\` carefully to avoid N+1 queries
- Implement pagination for large datasets
- Use database views for complex queries
- Consider read replicas for high-traffic apps
`}

### Connection Pooling

\`\`\`env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
DIRECT_URL="postgresql://user:pass@host:5432/db" # For migrations
\`\`\`

---

## Security

${context.constraints
  .filter(c => c.type === 'security')
  .map(c => `
**${c.category}**:
${c.rules.map(rule => `- ${rule}`).join('\n')}
`).join('\n') || `
- Never expose database credentials in code
- Use parameterized queries (Prisma does this by default)
- Implement row-level security where needed
- Audit log sensitive operations
- Encrypt sensitive fields at application level
`}

---

## Monitoring & Maintenance

### Database Health Checks

- Monitor query performance using Prisma's query events
- Set up alerts for slow queries (> 1s)
- Track connection pool utilization
- Monitor database size and growth rate

### Backup Strategy

- Automated daily backups
- Point-in-time recovery enabled
- Test backup restoration quarterly

---

## Next Steps

1. [ ] Review and refine model definitions based on detailed requirements
2. [ ] Add specific field types and constraints
3. [ ] Define all relationships between models
4. [ ] Create initial migration
5. [ ] Implement seed script
6. [ ] Add integration tests for critical queries

---

**Generated from**: ${context.sourcePath}
**Template**: prisma-schema
**Generated on**: ${new Date().toISOString().split('T')[0]}
`;
  }
};

// Helper functions
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}
