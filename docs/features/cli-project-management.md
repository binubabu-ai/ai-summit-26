# Feature: CLI Project Management Commands
**Slug:** cli-project-management
**Status:** Planned
**Owner:** CLI Team
**Created:** 2026-01-28
**Last updated:** 2026-01-28

## 1. Objective
- **Problem:** Users cannot manage DocJays projects from the CLI. The `link` command exists but there's no way to list projects, view project details, switch between projects, or manage API keys without using the web UI.
- **Success Criteria:**
  - Users can list all their projects via CLI
  - Users can view current linked project details
  - Users can switch between projects without re-linking
  - Users can list and rotate API keys
  - Users can view basic team information

## 2. Scope

### In scope
- `docjays projects list` - List all user's projects
- `docjays projects info` - Show current linked project details
- `docjays projects switch <id|slug>` - Switch to a different project
- `docjays api-keys list` - List API keys for current project
- `docjays api-keys create <name>` - Create a new API key
- `docjays api-keys revoke <id>` - Revoke an API key
- `docjays team list` - List team members for current project
- `docjays push` - Push local documents to cloud project

### Out of scope
- Team invitation/removal (keep in web UI for now)
- API key permission editing
- Project deletion from CLI
- Document conflict resolution UI

## 3. User Stories
- As a developer, I want to list my projects so that I can see what's available to link
- As a developer, I want to view my current project details so that I know what I'm working with
- As a developer, I want to switch between projects quickly without going through the full link flow
- As a developer, I want to manage API keys from CLI so that I can rotate credentials during deployments
- As a developer, I want to see who has access to my project so that I understand the team
- As a developer, I want to push my local docs to the cloud so that they're backed up and shareable

## 4. Requirements

### Functional Requirements
- FR1: `projects list` must show all projects user owns or is member of
- FR2: `projects info` must show project name, slug, API key status, document count, team count
- FR3: `projects switch` must update `.docjays/config.json` cloud config without full re-auth
- FR4: `api-keys list` must show key prefix (masked), status, last used, request count
- FR5: `api-keys create` must display the full key ONCE and warn user to save it
- FR6: `api-keys revoke` must require confirmation before revoking
- FR7: `team list` must show members with roles (OWNER, EDITOR, VIEWER)
- FR8: `push` must sync all documents in `.docjays/sources/` to cloud project
- FR9: All commands must require authentication (check for valid token)
- FR10: All commands must check for cloud link status where applicable

### Non-functional Requirements
- Performance: Commands should complete within 5 seconds on normal connection
- Security: Never display full API keys except on creation; use key prefix only
- Reliability: Graceful error handling if cloud is unreachable
- Observability: Log all API calls in debug mode

## 5. UX / API Contract

### CLI Commands

```bash
# List all projects
docjays projects list
docjays projects ls

# Show current project info
docjays projects info
docjays projects info --json  # Machine-readable output

# Switch to different project
docjays projects switch <project-id-or-slug>

# API Key management
docjays api-keys list
docjays api-keys create "CI/CD Pipeline"
docjays api-keys revoke <key-id> [--force]

# Team visibility
docjays team list
docjays team list --json

# Push documents to cloud
docjays push [--dry-run] [--force]
```

### API Endpoints (Existing)
These endpoints already exist and can be used:

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/projects` | GET | List user's projects |
| `/api/projects/[slug]` | GET | Get project details |
| `/api/projects/[slug]/api-keys` | GET | List API keys |
| `/api/projects/[slug]/api-keys` | POST | Create API key |
| `/api/projects/[slug]/api-keys/[id]` | DELETE | Delete API key |
| `/api/projects/[slug]/team` | GET | List team members |

### API Endpoints (New Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/projects/[slug]/api-keys/[id]` | PATCH | Toggle key active status (exists) |
| `/api/cli/projects/[projectId]/documents` | POST | Bulk upload documents from CLI |
| `/api/cli/projects/[projectId]/documents` | GET | List documents for sync comparison |

### Example: Projects List Response
```json
{
  "projects": [
    {
      "id": "clx123...",
      "name": "AI Summit",
      "slug": "ai-summit",
      "role": "OWNER",
      "documentCount": 15,
      "memberCount": 3,
      "createdAt": "2024-01-15T..."
    }
  ]
}
```

## 6. Data Model Impact

### No schema changes required
All necessary tables exist:
- `Project` - Projects table
- `ProjectMember` - Team membership
- `ApiKey` - API key storage
- `Document` - Documents (for push feature)

### New endpoint needed for bulk document upload
The `/api/cli/projects/[projectId]/documents` endpoint needs to:
- Accept array of `{ path, content }` objects
- Create/update documents in batch
- Return sync status (created, updated, unchanged)

## 7. Integration Impact

### External services impacted
- None - uses existing Supabase auth

### Auth method
- User token from `~/.docjays/auth.json` for user-scoped operations
- API key for document operations (when implemented)

## 8. Code Impact

### Files/modules likely to change

```
packages/docjays-cli/src/cli/index.ts          # Register new commands
packages/docjays-cli/src/cli/commands/link.ts  # Reuse project fetching logic
packages/docjays-cli/src/core/config.ts        # Add switchProject method
```

### New files/modules

```
packages/docjays-cli/src/cli/commands/projects.ts   # projects list/info/switch
packages/docjays-cli/src/cli/commands/api-keys.ts   # api-keys list/create/revoke
packages/docjays-cli/src/cli/commands/team.ts       # team list
packages/docjays-cli/src/cli/commands/push.ts       # push documents to cloud

app/api/cli/projects/[projectId]/documents/route.ts # Bulk document sync endpoint
```

## 9. Test Plan

### Unit Tests
- `projects.test.ts` - Test project list parsing, switch logic
- `api-keys.test.ts` - Test key masking, create validation
- `team.test.ts` - Test member role display
- `push.test.ts` - Test document gathering, sync diff calculation

### Integration Tests
- Test full `projects list` flow with mocked API
- Test `projects switch` updates config correctly
- Test `api-keys create` displays key once and warns
- Test `push --dry-run` shows what would sync

### E2E Tests
- Full flow: login → init → link → push → verify docs in cloud

### Regression Risks
- `link` command shares logic - ensure it still works
- Config file format changes could break existing setups

## 10. Rollout Plan
- Feature flag: No (additive commands)
- Migration strategy: None needed
- Backward compatibility: Full - new commands only
- Deployment notes:
  1. Deploy API endpoint first
  2. Rebuild and publish CLI
  3. Users upgrade via `npm update -g docjays`

## 11. Checklist
- [x] Plan reviewed
- [ ] Tests added/updated
- [ ] Lint/test/build pass
- [ ] Docs updated
- [ ] PR raised
- [ ] PR approved

---

## Implementation Order (Recommended)

### Phase 1: Project Management (Low risk, high value)
1. `projects list` - Uses existing `/api/projects` endpoint
2. `projects info` - Uses existing `/api/projects/[slug]` endpoint
3. `projects switch` - Config update only, no new API

### Phase 2: API Key Management
4. `api-keys list` - Uses existing endpoint
5. `api-keys create` - Uses existing endpoint
6. `api-keys revoke` - Uses existing DELETE endpoint

### Phase 3: Team & Push
7. `team list` - Uses existing `/api/projects/[slug]/team`
8. `push` - Requires new bulk upload endpoint

---

## Appendix: Existing API Response Formats

### GET /api/projects Response
```json
[
  {
    "id": "clx...",
    "name": "Project Name",
    "slug": "project-name",
    "ownerId": "user-id",
    "createdAt": "2024-...",
    "updatedAt": "2024-...",
    "_count": {
      "documents": 10,
      "proposals": 2
    }
  }
]
```

### GET /api/projects/[slug] Response
```json
{
  "id": "clx...",
  "name": "Project Name",
  "slug": "project-name",
  "ownerId": "user-id",
  "apiKeys": [{ "id": "...", "keyPrefix": "dj_proj_..." }],
  "documents": [...],
  "proposals": [...],
  "_count": { "members": 3 }
}
```

### GET /api/projects/[slug]/team Response
```json
{
  "members": [
    {
      "id": "member-id",
      "userId": "user-id",
      "role": "OWNER",
      "createdAt": "...",
      "user": { "id": "...", "email": "...", "name": "..." }
    }
  ],
  "currentUserRole": "OWNER"
}
```
