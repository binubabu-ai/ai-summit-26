# Web Documentation Update Plan

**Date:** 2026-01-27
**Status:** 🟡 Pending Implementation

---

## Summary of Changes

Update all web help documentation to reflect the new Supabase OAuth authentication flow and simplified architecture.

---

## Files to Update

### 1. app/help/cli/page.tsx

#### Quick Start Section (Line 134-150)

**Replace:**
```tsx
<CodeBlock
  language="bash"
  code={`# Initialize Docjays in your project
docjays init

# Add documentation sources
docjays add-source --name company-docs --type git --url https://github.com/myorg/docs
docjays add-source --name api-specs --type git --url https://github.com/myorg/api-specs

# Sync all documentation
docjays sync

# Start MCP server for Claude
docjays serve`}
/>
```

**With:**
```tsx
<CodeBlock
  language="bash"
  code={`# Step 1: Login to Docjays (one-time setup)
docjays login
# Opens browser → Login with your docjays.dev account

# Step 2: Initialize project
docjays init
# ✓ Project created
# ✓ API key auto-generated

# Step 3: Add documentation sources
docjays add-source --name company-docs --type git --url https://github.com/myorg/docs
docjays add-source --name api-specs --type git --url https://github.com/myorg/api-specs

# Step 4: Sync documentation
docjays sync

# Step 5: Start MCP server
docjays serve
# Your docs are now available to AI assistants!`}
/>

<div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
  <p className="text-sm text-blue-900 dark:text-blue-100">
    <strong>Local-Only Mode:</strong> Don't need cloud features? Use <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">docjays init --offline</code> to work completely offline.
  </p>
</div>
```

#### Installation Section (Lines 62-131)

**Update order - npm first:**
```tsx
{/* npm Registry Installation */}
<div className="mb-8">
  <h3 className="text-xl font-normal text-black dark:text-white mb-4">From npm (Recommended)</h3>
  <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
    Install Docjays CLI globally via npm:
  </p>
  <CodeBlock
    language="bash"
    code={`# Install globally
npm install -g docjays

# Verify installation
docjays --version`}
  />
  <p className="text-neutral-600 dark:text-neutral-400 mt-4">
    Or use without installation:
  </p>
  <CodeBlock
    language="bash"
    code="npx docjays init"
  />
</div>

{/* GitHub Packages Installation */}
<div className="mb-8">
  <h3 className="text-xl font-normal text-black dark:text-white mb-4">From GitHub Packages (For Techjays Team)</h3>
  {/* Keep existing GitHub Packages content */}
</div>
```

#### Add New Authentication Section

**Add after Quick Start (around line 160):**
```tsx
{/* Authentication */}
<section>
  <h2 className="text-3xl font-light text-black dark:text-white mb-8">Authentication</h2>

  <div className="space-y-8">
    {/* Global Login */}
    <div>
      <h3 className="text-xl font-normal text-black dark:text-white mb-4">Global Login (One-Time Setup)</h3>
      <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
        Login once to connect your CLI to your docjays.dev account:
      </p>
      <CodeBlock
        language="bash"
        code={`# Login with your docjays.dev account
docjays login
# Opens browser → Choose GitHub, Google, or Email

# Check login status
docjays whoami
# Output: Logged in as user@example.com

# Logout
docjays logout`}
      />
      <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Your login token is stored securely in <code className="bg-white dark:bg-black px-2 py-1 rounded">~/.docjays/auth.json</code> and works across all your projects.
        </p>
      </div>
    </div>

    {/* Project API Keys */}
    <div>
      <h3 className="text-xl font-normal text-black dark:text-white mb-4">Project API Keys (Auto-Generated)</h3>
      <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
        Each project gets its own API key automatically:
      </p>
      <CodeBlock
        language="bash"
        code={`cd my-project
docjays init
# ✓ Project created
# ✓ API Key generated: djkey_proj_abc123_xyz
# ✓ Saved to .docjays/config.json`}
      />
      <p className="text-neutral-600 dark:text-neutral-400 mt-4">
        The API key is used for:
      </p>
      <ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-400 ml-4 mt-2">
        <li>MCP server authentication</li>
        <li>All operations on this project</li>
        <li>Cloud sync (if logged in)</li>
        <li>Usage tracking and analytics</li>
      </ul>
    </div>

    {/* Private Sources */}
    <div>
      <h3 className="text-xl font-normal text-black dark:text-white mb-4">Private Documentation Sources</h3>
      <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
        For private GitHub/GitLab repos, connect via OAuth (no manual tokens!):
      </p>
      <CodeBlock
        language="bash"
        code={`# Connect GitHub account (one-time)
docjays connect github
# Opens browser → Authorize GitHub

# Now private repos work automatically!
docjays add-source \\
  --name private-docs \\
  --url https://github.com/company/private-docs

docjays sync
# ✓ Uses OAuth token automatically`}
      />
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <span className="text-sm font-medium text-black dark:text-white">GitHub</span>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Connect GitHub account</p>
        </div>
        <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <span className="text-sm font-medium text-black dark:text-white">GitLab</span>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Connect GitLab account</p>
        </div>
        <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg opacity-50">
          <span className="text-sm font-medium text-black dark:text-white">Bitbucket</span>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Coming soon</p>
        </div>
      </div>
    </div>

    {/* Summary */}
    <div className="p-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
      <h4 className="text-lg font-medium text-green-900 dark:text-green-100 mb-3">Simple Flow</h4>
      <ol className="space-y-2 text-sm text-green-800 dark:text-green-200">
        <li className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          <code>docjays login</code> → Connects to your account (once)
        </li>
        <li className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          <code>docjays init</code> → Auto-generates project API key
        </li>
        <li className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          <code>docjays connect github</code> → OAuth for private repos (if needed)
        </li>
        <li className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          <code>docjays serve</code> → Works automatically!
        </li>
      </ol>
      <p className="text-xs text-green-700 dark:text-green-300 mt-4">
        <strong>No more:</strong> Manual API key management • Master passwords • Copy-pasting keys • Multiple auth systems
      </p>
    </div>
  </div>
</section>
```

#### Update Commands Section

**Add new commands (around line 200):**
```tsx
<CommandCard
  icon={<Key className="w-5 h-5" />}
  name="login"
  description="Login to your docjays.dev account"
  usage="docjays login [options]"
  options={[
    { flag: '--github', description: 'Login with GitHub (default)' },
    { flag: '--google', description: 'Login with Google' },
    { flag: '--email', description: 'Login with Email/Password' },
  ]}
  example="docjays login --github"
/>

<CommandCard
  icon={<Eye className="w-5 h-5" />}
  name="whoami"
  description="Show current login status"
  usage="docjays whoami"
  example="docjays whoami"
/>

<CommandCard
  icon={<Key className="w-5 h-5" />}
  name="connect"
  description="Connect OAuth provider for private repos"
  usage="docjays connect <provider>"
  options={[
    { flag: 'github', description: 'Connect GitHub account' },
    { flag: 'gitlab', description: 'Connect GitLab account' },
  ]}
  example="docjays connect github"
/>
```

---

### 2. app/help/faq/page.tsx

#### Add New FAQ Items

**In "CLI Tool" section:**

```tsx
<FAQItem
  question="How do I login to Docjays CLI?"
  answer={
    <div>
      <p className="mb-3">Simply run <code className="bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">docjays login</code> and it will open your browser to login:</p>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm">
        docjays login
      </code>
      <p className="mt-3">You can login with:</p>
      <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
        <li>GitHub account</li>
        <li>Google account</li>
        <li>Email and password</li>
      </ul>
      <p className="mt-3 text-sm">This is a one-time setup - your login works across all projects.</p>
    </div>
  }
/>

<FAQItem
  question="How do I get an API key?"
  answer={
    <div>
      <p className="mb-3">API keys are automatically generated when you run <code className="bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">docjays init</code>:</p>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-2">
        docjays login  # First, login to your account
      </code>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-2">
        docjays init   # Creates project + generates API key
      </code>
      <p className="mt-3">The key is stored in <code className="bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">.docjays/config.json</code> and used automatically by the MCP server.</p>
      <p className="mt-3 text-sm">You can also view and manage keys in your dashboard at docjays.dev</p>
    </div>
  }
/>

<FAQItem
  question="Do I need to login for every project?"
  answer={
    <div>
      <p className="mb-2">No! You login once globally with <code className="bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">docjays login</code>.</p>
      <p className="mt-3">Each project then gets its own API key when you run <code className="bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">docjays init</code> in that project directory.</p>
      <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
        <li><strong>Global login:</strong> Once per machine</li>
        <li><strong>Project init:</strong> Once per project</li>
        <li><strong>No more steps!</strong> Everything works automatically</li>
      </ul>
    </div>
  }
/>

<FAQItem
  question="How do I access private GitHub repositories?"
  answer={
    <div>
      <p className="mb-3">Connect your GitHub account with OAuth - no manual tokens needed:</p>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-2">
        docjays connect github
      </code>
      <p className="mt-3">This opens your browser to authorize GitHub. After that, all private repos work automatically!</p>
      <p className="mt-3 text-sm">Supported: GitHub, GitLab (Bitbucket coming soon)</p>
    </div>
  }
/>
```

#### Update Existing FAQ Item

**Replace "How do I install the CLI?" answer:**

```tsx
<FAQItem
  question="How do I install the CLI?"
  answer={
    <div>
      <p className="mb-3 font-medium text-black dark:text-white">Recommended: From npm</p>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-2">
        npm install -g docjays
      </code>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-4">
        docjays --version
      </code>

      <p className="mb-2 font-medium text-black dark:text-white">Or use without installation:</p>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-4">
        npx docjays init
      </code>

      <p className="mb-2 font-medium text-black dark:text-white">For Techjays Team (GitHub Packages):</p>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-2">
        echo "@binubabu-ai:registry=https://npm.pkg.github.com" &gt;&gt; ~/.npmrc
      </code>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-2">
        npm login --scope=@binubabu-ai --registry=https://npm.pkg.github.com
      </code>
      <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm">
        npm install -g @binubabu-ai/docjays
      </code>

      <p className="mt-3 text-sm">
        See our <Link href="/help/cli" className="text-black dark:text-white underline hover:no-underline">CLI Tool Guide</Link> for detailed instructions.
      </p>
    </div>
  }
/>
```

---

### 3. Create New Page: app/help/authentication/page.tsx

**New comprehensive authentication guide:**

```tsx
import Link from 'next/link';
import { Key, Shield, GitBranch, Check, X } from 'lucide-react';
import { CodeBlock } from '@/components/help/CodeBlock';

export const metadata = {
  title: 'Authentication Guide - Docjays Help',
  description: 'Complete guide to Docjays authentication: login, API keys, and OAuth integrations',
};

export default function AuthenticationPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-6">
          Authentication Guide
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light max-w-3xl">
          Simple, secure authentication for CLI and MCP integration
        </p>
      </div>

      {/* Overview */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">How It Works</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
          Docjays uses a cloud-first authentication model that's simple and secure:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">1</span>
            </div>
            <h3 className="text-lg font-medium text-black dark:text-white mb-2">Global Login</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Login once to connect your CLI to your docjays.dev account
            </p>
            <code className="block mt-3 text-xs bg-neutral-100 dark:bg-neutral-900 p-2 rounded">
              docjays login
            </code>
          </div>

          <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-green-600 dark:text-green-300">2</span>
            </div>
            <h3 className="text-lg font-medium text-black dark:text-white mb-2">Project API Key</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Each project gets its own auto-generated API key
            </p>
            <code className="block mt-3 text-xs bg-neutral-100 dark:bg-neutral-900 p-2 rounded">
              docjays init
            </code>
          </div>

          <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-300">3</span>
            </div>
            <h3 className="text-lg font-medium text-black dark:text-white mb-2">OAuth (Optional)</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Connect GitHub/GitLab for private repositories
            </p>
            <code className="block mt-3 text-xs bg-neutral-100 dark:bg-neutral-900 p-2 rounded">
              docjays connect github
            </code>
          </div>
        </div>
      </section>

      {/* Complete flow and other sections... */}
      {/* See full implementation in IMPLEMENTATION_SUPABASE_OAUTH.md */}
    </div>
  );
}
```

---

### 4. Update Help Sidebar

**File:** `components/help/HelpSidebar.tsx`

Add new link:
```tsx
<Link
  href="/help/authentication"
  className="block py-2 px-4 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded"
>
  Authentication
</Link>
```

---

## Implementation Checklist

- [ ] Update `app/help/cli/page.tsx`
  - [ ] Reorder installation (npm first)
  - [ ] Update Quick Start with login step
  - [ ] Add Authentication section
  - [ ] Add login/whoami/connect commands

- [ ] Update `app/help/faq/page.tsx`
  - [ ] Add "How do I login?" FAQ
  - [ ] Add "How do I get an API key?" FAQ
  - [ ] Add "Do I need to login for every project?" FAQ
  - [ ] Add "How do I access private repos?" FAQ
  - [ ] Update installation FAQ

- [ ] Create `app/help/authentication/page.tsx`
  - [ ] Complete authentication guide
  - [ ] Flowcharts and diagrams
  - [ ] Troubleshooting section

- [ ] Update `components/help/HelpSidebar.tsx`
  - [ ] Add Authentication link

---

## Timeline

**Total time:** 4-6 hours

- CLI page update: 2 hours
- FAQ page update: 1 hour
- Authentication page creation: 2 hours
- Sidebar update: 15 minutes
- Testing & polish: 1 hour

---

**Status:** 🟡 Ready to implement
**Priority:** High (before Phase 1 code implementation)
