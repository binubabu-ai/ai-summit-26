# AI Features Implementation Roadmap

## 🎯 Vision
Transform Docjays into the world's first **hallucination-proof** documentation platform using AI.

---

## 📊 Feature Priority Matrix

```
         │ High Impact
         │
    🔥   │  Smart Doc Chat       Conflict Detection
  Impact │  ✓ Diff preview      ✓ Auto-detect
         │  ✓ Apply changes     ✓ Cross-doc
         │  ✓ Context aware     ✓ Severity levels
         │
    ⭐   │  Freshness Score     Risk Scoring
         │  ✓ Time decay        ✓ Composite
         │  ✓ Auto-flag         ✓ Criticality
         │
    💡   │  Suggestions         Audits
         │  ✓ Real-time         ✓ On-demand
         │  ✓ One-click         ✓ Reports
         │
         └──────────────────────────────
            Easy          Hard
              Effort →
```

---

## 🚀 Phase 1: Smart Doc Chat (Weeks 1-2)

### What We're Building
```
┌─────────────────────────────────────────────┐
│  architecture.md                    × Close │
├─────────────────────────────────────────────┤
│                                             │
│  # System Architecture               Chat  │
│                                      ┌────┐│
│  Our system uses microservices...    │    ││
│                                      │💬  ││
│  ## Database Layer                   │    ││
│  PostgreSQL for primary storage      │You ││
│                                      │"Make││
│                                      │this ││
│                                      │more ││
│  [User is typing here...]            │concise│
│                                      │    ││
│                                      │AI  ││
│                                      │Here's││
│                                      │a    ││
│                                      │rewrite│
│                                      │    ││
│                                      │[Show││
│                                      │Diff]││
│                                      └────┘│
└─────────────────────────────────────────────┘
```

### Components to Build:

1. **DocChat Component** (`components/editor/DocChat.tsx`)
   ```typescript
   <DocChat
     documentId={doc.id}
     content={currentContent}
     onApplySuggestion={(newContent) => {
       // Apply to editor
     }}
   />
   ```

2. **API Routes**:
   - `POST /api/ai/chat` - Send message, get response
   - `POST /api/ai/suggestions` - Generate suggestions with diffs
   - `POST /api/ai/apply` - Apply suggestion to document

3. **Database Models**:
   ```prisma
   model ChatMessage {
     id          String
     documentId  String
     role        String  // "user" | "assistant"
     content     String
     suggestions Json?
     createdAt   DateTime
   }

   model Suggestion {
     id            String
     documentId    String
     originalText  String
     suggestedText String
     reasoning     String
     status        String  // "pending" | "applied" | "rejected"
   }
   ```

4. **Diff Preview Component** (`components/editor/DiffPreview.tsx`)
   ```typescript
   <DiffPreview
     original="Our system uses microservices..."
     suggested="The system uses microservices..."
     onApply={() => applySuggestion()}
     onReject={() => rejectSuggestion()}
   />
   ```

### User Flow:
```
1. User opens document
   ↓
2. Chat sidebar appears (right side, 350px)
   ↓
3. User asks: "Make the intro more concise"
   ↓
4. AI analyzes document context
   ↓
5. AI generates rewrite + shows diff
   ↓
6. User reviews side-by-side comparison
   ↓
7. User clicks [Apply] → Changes inserted
   ↓
8. User can undo if needed
```

---

## 🔥 Phase 2: Conflict Detection (Weeks 3-4)

### What We're Building
```
┌─────────────────────────────────────────────┐
│  ⚠️ 3 Conflicts Detected                    │
├─────────────────────────────────────────────┤
│                                             │
│  ⚠️ Contradiction in api/auth.md            │
│                                             │
│  This document (architecture.md, line 42):  │
│  "We use JWT tokens for auth"              │
│                                             │
│  Conflicts with (api/auth.md, line 15):    │
│  "OAuth 2.0 is the only auth method"       │
│                                             │
│  Severity: 🔴 High                          │
│  Confidence: 95%                            │
│                                             │
│  [View api/auth.md]  [Mark Resolved]       │
│                                             │
├─────────────────────────────────────────────┤
│  ⚠️ Duplicate Info in setup.md              │
│  ...                                        │
└─────────────────────────────────────────────┘
```

### Detection Algorithm:
```typescript
1. Extract all "claims" from documents
   ↓
2. Generate semantic embeddings (OpenAI)
   ↓
3. Find similar claims (cosine similarity > 0.85)
   ↓
4. Use Claude to verify if they contradict
   ↓
5. Store conflicts in database
   ↓
6. Show in UI with severity badges
```

### Background Job:
```typescript
// Runs every 6 hours
cron.schedule('0 */6 * * *', async () => {
  for (const project of activeProjects) {
    await detectConflicts(project.id);
  }
});
```

---

## 💡 Phase 3: Real-time Suggestions (Weeks 5-6)

### What We're Building
```
┌─────────────────────────────────────────────┐
│  architecture.md                            │
├─────────────────┬───────────────────────────┤
│                 │ 💡 Suggestions      [3]  │
│  # Architecture │                          │
│                 │ ⚠️ Missing Examples      │
│  Our system... │ Line 15: Add code        │
│                 │ example for clarity      │
│  [Typing...]    │ [Add Example]           │
│                 │                          │
│                 │ ✍️ Style: Passive Voice  │
│                 │ Line 22: "is used by"   │
│                 │ → "uses"                 │
│                 │ [Apply Fix]             │
│                 │                          │
│                 │ 🔗 Related Documents     │
│                 │ • setup.md              │
│                 │ • api/overview.md       │
│                 │ [View]                  │
└─────────────────┴───────────────────────────┘
```

### Auto-Analysis Trigger:
```typescript
// Debounced analysis after 5 seconds of no typing
useEffect(() => {
  const timer = setTimeout(() => {
    analyzeCurrent();
  }, 5000);
  return () => clearTimeout(timer);
}, [content]);
```

---

## 📊 Phase 4: Scoring System (Weeks 7-8)

### Freshness Score
```
┌──────────────────────────────┐
│ 📄 api/auth.md               │
│                              │
│ 🟢 Fresh (0.92)             │
│ └─ Updated 3 days ago        │
│ └─ No related changes        │
│ └─ Dependencies up-to-date   │
│                              │
│ 🟡 Medium Risk (0.45)       │
│ └─ 2 minor conflicts         │
│ └─ Moderate complexity       │
│ └─ 15 incoming links         │
└──────────────────────────────┘
```

### Risk Score
```
┌──────────────────────────────┐
│ 📄 deprecated-api.md         │
│                              │
│ 🔴 Stale (0.12)             │
│ └─ Updated 8 months ago      │
│ └─ 5 related docs changed    │
│ └─ External API deprecated   │
│                              │
│ 🔴 High Risk (0.88)         │
│ └─ 6 conflicts detected      │
│ └─ Critical for onboarding   │
│ └─ Complex technical content │
│                              │
│ ⚠️ ACTION REQUIRED           │
│ This doc needs review!       │
│ [Schedule Audit]             │
└──────────────────────────────┘
```

---

## 🔍 Phase 5: Document Audits (Weeks 9-10)

### Audit Report UI
```
┌─────────────────────────────────────────────┐
│  Audit Report: architecture.md              │
│  Generated: 2026-01-24 14:30               │
├─────────────────────────────────────────────┤
│                                             │
│  Overall Score: 7.2/10                      │
│  ▓▓▓▓▓▓▓░░░                                │
│                                             │
│  ✅ Completeness: 8/10                      │
│  • Has introduction                         │
│  • Has examples                             │
│  ⚠️ Missing troubleshooting section        │
│                                             │
│  ⚠️ Clarity: 6/10                           │
│  • Average sentence length: 28 words       │
│  • 15 instances of passive voice           │
│  • Jargon without definitions (3)          │
│                                             │
│  ✅ Consistency: 8/10                       │
│  • Consistent formatting                    │
│  ⚠️ Mixed terminology (API key/token)      │
│                                             │
│  ⚠️ Technical Accuracy: 7/10                │
│  ❌ Syntax error in code (line 89)         │
│  ⚠️ Deprecated API reference (line 124)    │
│                                             │
│  [View Full Report]  [Fix Issues]          │
└─────────────────────────────────────────────┘
```

---

## 💰 Cost Optimization Strategy

### Model Selection:
| Task | Model | Cost/1M tokens | When to Use |
|------|-------|----------------|-------------|
| Smart Chat | Opus 4.5 | $15/$75 | User-facing, needs best quality |
| Quick Suggestions | Haiku | $0.25/$1.25 | Real-time, needs speed |
| Conflict Check | Sonnet | $3/$15 | Background, needs accuracy |
| Embeddings | OpenAI | $0.02 | Semantic search |

### Caching Strategy:
```typescript
// Cache by content hash (1 hour)
const key = `analysis:${sha256(content)}`;
if (await redis.exists(key)) {
  return await redis.get(key);
}

// Cache suggestions by section (24 hours)
const key = `suggestions:${docId}:${sectionHash}`;
```

### Rate Limits:
```
Free Tier:
- 50 chat messages/month
- 10 suggestions/day
- Weekly conflict scans

Pro Tier ($29/mo):
- Unlimited chat
- Unlimited suggestions
- Hourly conflict scans
- Priority API access
```

---

## 📈 Success Metrics

### Week 1-2 (Smart Chat):
- [ ] 50% of users try chat feature
- [ ] 30% apply at least one suggestion
- [ ] <2s average response time
- [ ] <$0.50 cost per active user

### Week 3-4 (Conflicts):
- [ ] Detect 80%+ of known conflicts
- [ ] <5% false positive rate
- [ ] 40% of conflicts resolved in 24h

### Week 5-6 (Suggestions):
- [ ] 60% suggestion acceptance rate
- [ ] <3s analysis time
- [ ] 20% reduction in doc update time

### Week 7-8 (Scoring):
- [ ] 90% accuracy on freshness
- [ ] Risk scores correlate with actual issues
- [ ] Auto-flagging reduces manual reviews 50%

### Week 9-10 (Audits):
- [ ] 70% audit score accuracy
- [ ] Users fix 50%+ of identified issues
- [ ] 30% improvement in doc quality

---

## 🎯 MVP: Week 1 Implementation Plan

Let's start with the most impactful feature: **Smart Doc Chat**

### Day 1-2: Setup & Database
- [ ] Add ChatMessage and Suggestion models to Prisma
- [ ] Run migrations
- [ ] Set up Claude API integration
- [ ] Create base chat API route

### Day 3-4: Chat UI
- [ ] Build DocChat sidebar component
- [ ] Message bubbles (user/AI)
- [ ] Loading states
- [ ] Error handling

### Day 5-6: Suggestions & Diffs
- [ ] Diff generation engine
- [ ] DiffPreview component
- [ ] Apply/reject functionality
- [ ] Undo support

### Day 7: Polish & Test
- [ ] Quick action buttons
- [ ] Cost tracking
- [ ] Rate limiting
- [ ] End-to-end testing

---

## 🚦 Go/No-Go Criteria

Before moving to next phase:

✅ **Required**:
- Feature works end-to-end
- Cost per user < target
- No critical bugs
- User testing with 5+ people

⚠️ **Nice to Have**:
- 80%+ user satisfaction
- <2s response time
- Mobile responsive

🛑 **Blockers**:
- API costs too high
- Poor suggestion quality
- Legal/safety concerns

---

## 📦 Deliverables Summary

By end of 12 weeks:

1. ✅ Smart Doc Chat with diff preview
2. ✅ Real-time suggestion sidebar
3. ✅ Automatic conflict detection
4. ✅ Freshness & risk scoring
5. ✅ On-demand document audits
6. ✅ Analytics dashboard
7. ✅ Cost tracking & optimization
8. ✅ User documentation
9. ✅ Admin controls
10. ✅ API for programmatic access

---

**Ready to start building! Which feature should we implement first?**

My recommendation: **Smart Doc Chat** (highest impact, most user-facing)
