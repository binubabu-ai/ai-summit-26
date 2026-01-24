# TanStack Query Integration Guide

This guide explains how we use TanStack Query (React Query) in Docjays for optimal performance and developer experience.

## Why TanStack Query?

### Problems Solved

1. **Repeated Fetches**: Navigating back to a page refetched data unnecessarily
2. **No Caching**: Every component fetch was independent
3. **Loading States**: Managing loading states manually everywhere
4. **Stale Data**: No automatic background updates
5. **Error Handling**: Inconsistent error handling across components

### Benefits

- **Automatic Caching**: Data fetched once is reused across the app
- **Background Revalidation**: Fresh data without blocking UI
- **Optimistic Updates**: Instant UI updates before server confirms
- **Deduplication**: Multiple components requesting same data = single request
- **Error Retry**: Automatic retry with exponential backoff
- **DevTools**: Built-in debugging tools in development

## Configuration

### Query Client Setup

Location: [components/providers/query-provider.tsx](../components/providers/query-provider.tsx)

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // Data fresh for 30 seconds
      gcTime: 5 * 60 * 1000,       // Cache for 5 minutes
      retry: 1,                     // Retry once on failure
      refetchOnWindowFocus: true,   // Refetch when window focused
      refetchOnMount: false,        // Don't refetch if data is fresh
      refetchOnReconnect: false,    // Don't refetch on reconnect if fresh
    },
  },
})
```

### Stale Time vs Cache Time

- **Stale Time (30s)**: How long data is considered "fresh"
  - Fresh data = no refetch on component mount
  - Prevents unnecessary requests

- **Cache Time (5min)**: How long unused data stays in memory
  - After this, data is garbage collected
  - Balances memory usage and UX

## Available Hooks

### Projects

**Location**: [lib/hooks/useProjects.ts](../lib/hooks/useProjects.ts)

```typescript
import { useProjects, useProject, useCreateProject, useDeleteProject } from '@/lib/hooks/useProjects';

// Fetch all projects
const { data: projects, isLoading, error } = useProjects();

// Fetch single project by slug
const { data: project } = useProject('my-project');

// Create project
const createProject = useCreateProject();
await createProject.mutateAsync({ name, slug, description });

// Delete project
const deleteProject = useDeleteProject();
await deleteProject.mutateAsync(projectSlug);
```

### Documents

**Location**: [lib/hooks/useDocuments.ts](../lib/hooks/useDocuments.ts)

```typescript
import {
  useDocuments,
  useDocument,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument
} from '@/lib/hooks/useDocuments';

// Fetch all documents in project
const { data: documents } = useDocuments(projectSlug);

// Fetch single document by path
const { data: document } = useDocument(projectSlug, ['README.md']);

// Create document
const createDoc = useCreateDocument(projectSlug);
await createDoc.mutateAsync({ title, path, content, projectId });

// Update document
const updateDoc = useUpdateDocument(projectSlug, documentId);
await updateDoc.mutateAsync({ content });

// Delete document
const deleteDoc = useDeleteDocument(projectSlug);
await deleteDoc.mutateAsync(documentId);
```

### Revisions

**Location**: [lib/hooks/useRevisions.ts](../lib/hooks/useRevisions.ts)

```typescript
import {
  useRevisions,
  useRevision,
  useCreateRevision,
  useApproveRevision,
  useRejectRevision
} from '@/lib/hooks/useRevisions';

// Fetch all revisions for document
const { data: revisions } = useRevisions(documentId, 'all');

// Fetch only my revisions
const { data: myRevisions } = useRevisions(documentId, 'mine');

// Fetch single revision
const { data: revision } = useRevision(revisionId);

// Create revision
const createRevision = useCreateRevision();
await createRevision.mutateAsync({
  documentId,
  content,
  title,
  description,
  status: 'proposed'
});

// Approve revision
const approveRevision = useApproveRevision();
await approveRevision.mutateAsync(revisionId);

// Reject revision
const rejectRevision = useRejectRevision();
await rejectRevision.mutateAsync({ revisionId, reason: 'Not ready' });
```

### User

**Location**: [lib/hooks/useUser.ts](../lib/hooks/useUser.ts)

```typescript
import { useAuthUser, useCurrentUser } from '@/lib/hooks/useUser';

// Fetch Supabase auth user
const { data: authUser } = useAuthUser();

// Fetch user from our database
const { data: user } = useCurrentUser();
```

## Usage Patterns

### Basic Query

```typescript
function ProjectsList() {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) return <PageLoader />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

### Mutation with Loading State

```typescript
function CreateProjectForm() {
  const createProject = useCreateProject();

  const handleSubmit = async (data) => {
    try {
      await createProject.mutateAsync(data);
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createProject.isPending}>
        {createProject.isPending ? (
          <>
            <Loader size="sm" />
            Creating...
          </>
        ) : (
          'Create Project'
        )}
      </button>
    </form>
  );
}
```

### Optimistic Updates

```typescript
const updateDoc = useUpdateDocument(projectSlug, documentId);

// UI updates immediately, rollback on error
await updateDoc.mutateAsync(
  { content: newContent },
  {
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['projects', projectSlug, 'documents', documentId]
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData([
        'projects', projectSlug, 'documents', documentId
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ['projects', projectSlug, 'documents', documentId],
        { ...previous, content: newContent }
      );

      return { previous };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ['projects', projectSlug, 'documents', documentId],
        context.previous
      );
    },
  }
);
```

### Dependent Queries

```typescript
function DocumentEditor({ projectSlug, documentPath }) {
  // First, fetch project
  const { data: project } = useProject(projectSlug);

  // Then fetch document (only if project loaded)
  const { data: document } = useDocument(
    projectSlug,
    documentPath,
    { enabled: !!project } // Only run if project exists
  );

  if (!project || !document) return <PageLoader />;

  return <Editor document={document} />;
}
```

### Pagination

```typescript
function DocumentsList({ projectSlug }) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDocuments(projectSlug, {
    page,
    limit: 20
  });

  return (
    <div>
      {data?.documents.map(doc => <DocumentCard key={doc.id} doc={doc} />)}

      <Pagination
        page={page}
        total={data?.total}
        onChange={setPage}
      />
    </div>
  );
}
```

### Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteDocumentsList({ projectSlug }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['projects', projectSlug, 'documents', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      fetchDocuments(projectSlug, pageParam),
    getNextPageParam: (lastPage, pages) => lastPage.nextPage,
  });

  return (
    <div>
      {data?.pages.map((page) =>
        page.documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Cache Invalidation

### When to Invalidate

After mutations that change server state:

```typescript
const createDoc = useCreateDocument(projectSlug);

createDoc.mutate(newDoc, {
  onSuccess: () => {
    // Invalidate and refetch documents list
    queryClient.invalidateQueries({
      queryKey: ['projects', projectSlug, 'documents']
    });
  },
});
```

### Invalidation Strategies

**Specific Query:**
```typescript
queryClient.invalidateQueries({
  queryKey: ['projects', projectSlug]
});
```

**All Related Queries:**
```typescript
queryClient.invalidateQueries({
  queryKey: ['projects'] // Invalidates all project queries
});
```

**Predicate-Based:**
```typescript
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'projects' &&
    query.queryKey[1] === projectSlug
});
```

## Error Handling

### Global Error Boundary

```typescript
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>
          Error: {error.message}
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

### Per-Query Error Handling

```typescript
const { data, error, isError } = useProjects({
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (error) => {
    console.error('Failed to fetch projects:', error);
    toast.error('Failed to load projects');
  },
});

if (isError) {
  return <ErrorState error={error} />;
}
```

## DevTools

In development, React Query DevTools are available in the bottom-right corner:

```typescript
// Already configured in query-provider.tsx
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
)}
```

**Features:**
- View all queries and their states
- Inspect cache data
- See query keys
- Manually trigger refetches
- View query timelines
- Debug stale/fresh states

## Performance Tips

### 1. Use Appropriate Stale Times

```typescript
// Fast-changing data
useRevisions(docId, { staleTime: 15 * 1000 }); // 15 seconds

// Slow-changing data
useUser({ staleTime: 5 * 60 * 1000 }); // 5 minutes

// Static data
useConfig({ staleTime: Infinity }); // Never refetch
```

### 2. Prefetch Data

```typescript
const queryClient = useQueryClient();

// Prefetch before navigation
const handleProjectClick = (slug: string) => {
  queryClient.prefetchQuery({
    queryKey: ['projects', slug],
    queryFn: () => fetchProject(slug),
  });
  router.push(`/projects/${slug}`);
};
```

### 3. Select Data

```typescript
// Only re-render when specific field changes
const { data: projectName } = useProject(slug, {
  select: (project) => project.name,
});
```

### 4. Disable Queries Conditionally

```typescript
const { data } = useDocument(projectSlug, path, {
  enabled: !!projectSlug && path.length > 0,
});
```

## Migration Guide

### Before (Direct Fetch)

```typescript
function ProjectPage({ params }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/projects/${params.slug}`)
      .then(res => res.json())
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [params.slug]);

  if (loading) return <PageLoader />;
  if (error) return <div>Error</div>;

  return <div>{project.name}</div>;
}
```

### After (TanStack Query)

```typescript
function ProjectPage({ params }) {
  const { data: project, isLoading, error } = useProject(params.slug);

  if (isLoading) return <PageLoader />;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{project.name}</div>;
}
```

**Benefits:**
- Less boilerplate code
- Automatic caching
- No repeated fetches on navigation
- Better error handling
- Loading states managed automatically

## Best Practices

1. **Query Keys**: Use consistent, hierarchical keys
   ```typescript
   ['projects']
   ['projects', slug]
   ['projects', slug, 'documents']
   ['projects', slug, 'documents', docId]
   ```

2. **Mutations**: Always invalidate related queries
   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['projects'] });
   }
   ```

3. **Error Messages**: Provide user-friendly errors
   ```typescript
   if (error) {
     return <ErrorMessage>Failed to load projects. Please try again.</ErrorMessage>;
   }
   ```

4. **Loading States**: Use skeleton loaders for better UX
   ```typescript
   if (isLoading) return <SkeletonProjectCard />;
   ```

5. **Optimistic Updates**: For instant feedback on user actions

6. **Prefetching**: For predictable navigation patterns

## Common Patterns

### Search with Debounce

```typescript
function SearchDocuments() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data } = useQuery({
    queryKey: ['documents', 'search', debouncedSearch],
    queryFn: () => searchDocuments(debouncedSearch),
    enabled: debouncedSearch.length > 2,
  });

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {data?.map(doc => <div key={doc.id}>{doc.title}</div>)}
    </div>
  );
}
```

### Polling

```typescript
const { data } = useQuery({
  queryKey: ['projects', slug, 'status'],
  queryFn: () => fetchProjectStatus(slug),
  refetchInterval: 5000, // Poll every 5 seconds
});
```

### Window Focus Refetching

```typescript
// Enabled by default - refetch when user returns to tab
const { data } = useProjects({
  refetchOnWindowFocus: true,
});
```

## Troubleshooting

### Query Not Refetching

- Check `staleTime` - data might still be fresh
- Check `enabled` - query might be disabled
- Check DevTools to see query state

### Too Many Requests

- Increase `staleTime`
- Disable `refetchOnMount`, `refetchOnWindowFocus`
- Use `refetchInterval` carefully

### Memory Leaks

- Ensure `gcTime` is set appropriately
- Cancel queries on component unmount
- Use `enabled: false` for conditional queries

### Cache Not Updating

- Verify cache invalidation after mutations
- Check query keys match exactly
- Use DevTools to inspect cache state

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Community Examples](https://tanstack.com/query/latest/docs/react/examples/react/basic)
