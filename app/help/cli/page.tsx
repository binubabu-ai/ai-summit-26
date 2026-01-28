import Link from 'next/link';
import { Terminal, Package, GitBranch, RefreshCw, Server, ListTree, Trash2, Eye, Key, CheckCircle2, ArrowRight, Link2, Unlink, FolderInput, FileText, Users, KeyRound, Upload, Clock } from 'lucide-react';
import { CodeBlock } from '@/components/help/CodeBlock';

export const metadata = {
  title: 'CLI Tool - Docjays Help',
  description: 'Docjays CLI for managing documentation sources and MCP integration',
};

export default function CLIPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-6">
          Docjays CLI
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light max-w-3xl">
          Command-line tool for managing documentation sources in your projects while keeping them separate from your main codebase.
        </p>
      </div>

      {/* What is Docjays CLI */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">What is Docjays CLI?</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
          Docjays CLI is a command-line tool that helps you manage documentation sources in your projects. Perfect for client projects where you want to maintain company standards, API docs, and architecture references without committing them to the client's repository.
        </p>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Clone & Sync</strong> - Pull documentation from Git repos, HTTP URLs, or local paths
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">MCP Integration</strong> - Expose docs to Claude via Model Context Protocol
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Auto-Sync</strong> - Keep documentation up-to-date automatically
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Multi-Source</strong> - Manage multiple documentation sources
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Git-Ignored</strong> - Keeps .docjays/ out of your repository
            </span>
          </li>
        </ul>
      </section>

      {/* Installation */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Installation</h2>

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

        {/* Local Development */}
        <div>
          <h3 className="text-xl font-normal text-black dark:text-white mb-4">For Development</h3>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            Install from local repository:
          </p>
          <CodeBlock
            language="bash"
            code={`git clone https://github.com/techjays/ai-summit.git
cd ai-summit/packages/docjays-cli
npm install
npm run build
npm link`}
          />
        </div>
      </section>

      {/* Quick Start */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Quick Start</h2>
        <CodeBlock
          language="bash"
          code={`# Step 1: Login to Docjays (one-time setup)
docjays login
# Opens browser → Login with your docjays account

# Step 2: Initialize project
docjays init
# ✓ Project created + API key auto-generated

# Step 3: Link to cloud project (optional but recommended)
docjays link
# ✓ Select existing project or create new one

# Step 4: Add documentation sources
docjays add-source --name company-docs --type git --url https://github.com/myorg/docs
docjays add-source --name api-specs --type git --url https://github.com/myorg/api-specs

# Step 5: Sync documentation
docjays sync

# Step 6: Start MCP server
docjays serve
# Your docs are now available to AI assistants!`}
        />
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Local-Only Mode:</strong> Don't need cloud features? Use <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">docjays init --offline</code> to work completely offline.
          </p>
        </div>
      </section>

      {/* Commands */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-12">Commands</h2>

        <div className="space-y-8">
          <CommandCard
            icon={<Key className="w-5 h-5" />}
            name="login"
            description="Login to your docjays account (one-time setup)"
            usage="docjays login"
            options={[]}
            example="docjays login"
          />

          <CommandCard
            icon={<Eye className="w-5 h-5" />}
            name="whoami"
            description="Show current login status"
            usage="docjays whoami"
            options={[]}
            example="docjays whoami"
          />

          <CommandCard
            icon={<Key className="w-5 h-5" />}
            name="logout"
            description="Remove global authentication token"
            usage="docjays logout"
            options={[]}
            example="docjays logout"
          />

          <CommandCard
            icon={<Package className="w-5 h-5" />}
            name="init"
            description="Initialize Docjays in your project (auto-generates API key)"
            usage="docjays init [options]"
            options={[
              { flag: '-n, --name <name>', description: 'Project name (default: folder name)' },
              { flag: '--offline', description: 'Initialize without cloud (local-only)' },
              { flag: '-y, --yes', description: 'Skip prompts and use defaults' },
              { flag: '--no-gitignore', description: 'Skip updating .gitignore' },
            ]}
            example="docjays init --name my-project"
          />

          <CommandCard
            icon={<Link2 className="w-5 h-5" />}
            name="link"
            description="Link local .docjays to a cloud project (or create new)"
            usage="docjays link [options]"
            options={[
              { flag: '-p, --project <id>', description: 'Project ID to link to directly' },
            ]}
            example="docjays link"
          />

          <CommandCard
            icon={<Unlink className="w-5 h-5" />}
            name="unlink"
            description="Disconnect from cloud project (switch to local-only mode)"
            usage="docjays unlink [options]"
            options={[
              { flag: '-f, --force', description: 'Skip confirmation prompt' },
            ]}
            example="docjays unlink"
          />

          <CommandCard
            icon={<FolderInput className="w-5 h-5" />}
            name="migrate"
            description="Discover and migrate existing documentation to .docjays"
            usage="docjays migrate [options]"
            options={[
              { flag: '--auto', description: 'Automatically migrate all found docs without prompts' },
              { flag: '--move', description: 'Move files instead of copying (default: copy)' },
              { flag: '--dry', description: 'Dry run - show what would be migrated' },
            ]}
            example="docjays migrate --dry"
          />

          <CommandCard
            icon={<FileText className="w-5 h-5" />}
            name="create-skills"
            description="Create skills.md file for AI agent instructions"
            usage="docjays create-skills [options]"
            options={[
              { flag: '-o, --output <file>', description: 'Output to specific file (default: skills.md)' },
              { flag: '-f, --force', description: 'Overwrite if exists' },
              { flag: '-m, --merge', description: 'Append to existing file' },
              { flag: '-p, --print', description: 'Print template without creating file' },
            ]}
            example="docjays create-skills"
          />

          <CommandCard
            icon={<GitBranch className="w-5 h-5" />}
            name="add-source"
            description="Add a documentation source"
            usage="docjays add-source [options]"
            options={[
              { flag: '-n, --name <name>', description: 'Source name (required)' },
              { flag: '-t, --type <type>', description: 'Source type: git, http, local (required)' },
              { flag: '-u, --url <url>', description: 'Source URL or path (required)' },
              { flag: '-b, --branch <name>', description: 'Git branch (default: main)' },
              { flag: '--no-sync', description: "Don't sync after adding" },
            ]}
            example="docjays add-source --name company-docs --type git --url https://github.com/myorg/docs"
          />

          <CommandCard
            icon={<RefreshCw className="w-5 h-5" />}
            name="sync"
            description="Sync documentation from all sources"
            usage="docjays sync [options]"
            options={[
              { flag: '-s, --source <name>', description: 'Sync specific source only' },
              { flag: '-f, --force', description: 'Force re-clone (delete and clone fresh)' },
            ]}
            example="docjays sync --source company-docs"
          />

          <CommandCard
            icon={<Server className="w-5 h-5" />}
            name="serve"
            description="Start MCP server for Claude integration"
            usage="docjays serve [options]"
            options={[
              { flag: '--stdio', description: 'Use stdio transport (default)' },
              { flag: '-p, --port <port>', description: 'Port for HTTP transport (future)' },
            ]}
            example="docjays serve"
          />

          <CommandCard
            icon={<Terminal className="w-5 h-5" />}
            name="status"
            description="Show Docjays status and statistics"
            usage="docjays status [options]"
            options={[
              { flag: '--json', description: 'Output as JSON' },
            ]}
            example="docjays status"
          />

          <CommandCard
            icon={<ListTree className="w-5 h-5" />}
            name="list-sources"
            description="List all configured documentation sources"
            usage="docjays list-sources [options]"
            options={[
              { flag: '--enabled', description: 'Show only enabled sources' },
              { flag: '--disabled', description: 'Show only disabled sources' },
              { flag: '--json', description: 'Output as JSON' },
            ]}
            example="docjays list-sources --enabled"
          />

          <CommandCard
            icon={<Trash2 className="w-5 h-5" />}
            name="clean"
            description="Clean cache, logs, or remove entire .docjays folder"
            usage="docjays clean [options]"
            options={[
              { flag: '--cache', description: 'Clean cache only' },
              { flag: '--logs', description: 'Clean logs only' },
              { flag: '--all', description: 'Remove entire .docjays folder' },
              { flag: '-f, --force', description: 'Skip confirmation prompt' },
            ]}
            example="docjays clean --cache"
          />

          <CommandCard
            icon={<RefreshCw className="w-5 h-5" />}
            name="watch"
            description="Watch and auto-sync documentation at regular intervals"
            usage="docjays watch [options]"
            options={[
              { flag: '-i, --interval <time>', description: 'Sync interval (e.g., 1h, 30m, 5m) (default: 30m)' },
              { flag: '--sync-now', description: 'Sync immediately on start' },
            ]}
            example="docjays watch -i 1h --sync-now"
          />

          <CommandCard
            icon={<Upload className="w-5 h-5" />}
            name="push"
            description="Push local documentation to cloud project"
            usage="docjays push [options]"
            options={[
              { flag: '-n, --dry-run', description: 'Preview what would be pushed without making changes' },
              { flag: '-f, --force', description: 'Push all files even if unchanged' },
            ]}
            example="docjays push --dry-run"
          />
        </div>
      </section>

      {/* Coming Soon */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Coming Soon</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
          The following commands are planned for upcoming releases:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-950">
            <div className="flex items-center gap-3 mb-4">
              <ListTree className="w-5 h-5 text-neutral-500" />
              <h3 className="font-mono font-medium text-black dark:text-white">projects</h3>
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">planned</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">
              Manage cloud projects from CLI
            </p>
            <CodeBlock language="bash" code={`docjays projects list
docjays projects info
docjays projects switch <id>`} />
          </div>

          <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-950">
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-5 h-5 text-neutral-500" />
              <h3 className="font-mono font-medium text-black dark:text-white">api-keys</h3>
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">planned</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">
              Manage API keys for your projects
            </p>
            <CodeBlock language="bash" code={`docjays api-keys list
docjays api-keys create "CI/CD"
docjays api-keys revoke <id>`} />
          </div>

          <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-950">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-neutral-500" />
              <h3 className="font-mono font-medium text-black dark:text-white">team</h3>
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">planned</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">
              View team members for your project
            </p>
            <CodeBlock language="bash" code={`docjays team list
docjays team list --json`} />
          </div>

        </div>
      </section>

      {/* MCP Integration */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">MCP Integration</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
          To use Docjays CLI with Claude Desktop, add this to your MCP settings:
        </p>
        <div className="space-y-6">
          <div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-3">
              <strong className="text-black dark:text-white">macOS:</strong> <code className="text-sm bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code>
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mb-3">
              <strong className="text-black dark:text-white">Windows:</strong> <code className="text-sm bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">%APPDATA%\Claude\claude_desktop_config.json</code>
            </p>
          </div>
          <CodeBlock
            language="json"
            code={`{
  "mcpServers": {
    "docjays-cli": {
      "command": "docjays",
      "args": ["serve", "--stdio"],
      "env": {}
    }
  }
}`}
          />
          <p className="text-neutral-600 dark:text-neutral-400">
            After updating the config, restart Claude Desktop. Docjays will expose your local documentation to Claude via MCP.
          </p>
        </div>
      </section>

      {/* Authentication */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Authentication</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-normal text-black dark:text-white mb-4">Global Login</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
              Login once to connect your CLI to your docjays account:
            </p>
            <CodeBlock
              language="bash"
              code={`# Login with email/password
docjays login

# Check login status
docjays whoami

# Logout
docjays logout`}
            />
            <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Your login token is stored securely in <code className="bg-white dark:bg-black px-2 py-1 rounded">~/.docjays/auth.json</code> and works across all your projects.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-normal text-black dark:text-white mb-4">Project API Keys</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
              Each project gets its own API key automatically when you run <code className="bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">docjays init</code>:
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
              The API key is used for MCP server authentication and all operations on this project.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-normal text-black dark:text-white mb-4">Working with Private Repositories</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
              For private repositories, store credentials locally:
            </p>
            <CodeBlock
              language="bash"
              code={`# Add credential (e.g., GitHub token)
docjays auth add my-token --type token

# Use credential with source
docjays add-source --name private-docs \\
  --type git \\
  --url https://github.com/myorg/private-docs \\
  --auth my-token

# Sync
docjays sync`}
            />
            <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Credentials are encrypted and stored in <code className="bg-white dark:bg-black px-2 py-1 rounded">.docjays/config.json</code>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Common Use Cases</h2>
        <div className="space-y-6">
          <UseCaseCard
            title="Client Project Development"
            description="Keep company coding standards and API docs separate from client repositories"
            example={`docjays init
docjays add-source --name company-standards --type git --url https://github.com/mycompany/standards
docjays add-source --name api-docs --type git --url https://github.com/mycompany/api-docs
docjays watch -i 1h`}
          />

          <UseCaseCard
            title="Feature-First Development"
            description="Manage feature specifications and architecture docs"
            example={`docjays init
docjays add-source --name feature-specs --type local --url ./docs/features
docjays serve`}
          />

          <UseCaseCard
            title="Multi-Repo Documentation"
            description="Aggregate documentation from multiple repositories"
            example={`docjays add-source --name frontend-docs --type git --url https://github.com/org/frontend
docjays add-source --name backend-docs --type git --url https://github.com/org/backend
docjays add-source --name api-specs --type http --url https://api.example.com/specs.json
docjays sync`}
          />
        </div>
      </section>

      {/* Next Steps */}
      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-12">
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Next Steps</h2>
        <div className="space-y-4">
          <Link
            href="/help/api/mcp"
            className="flex items-center justify-between p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group bg-white dark:bg-black"
          >
            <div>
              <h3 className="font-normal text-lg text-black dark:text-white mb-1">MCP Integration Guide</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Learn about Model Context Protocol integration</p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
          <Link
            href="/help/faq"
            className="flex items-center justify-between p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group bg-white dark:bg-black"
          >
            <div>
              <h3 className="font-normal text-lg text-black dark:text-white mb-1">Frequently Asked Questions</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Find answers to common questions</p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function CommandCard({
  icon,
  name,
  description,
  usage,
  options,
  example,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  usage: string;
  options: { flag: string; description: string }[];
  example: string;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-black">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-black dark:text-white flex-shrink-0 mt-1">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-mono font-medium text-black dark:text-white mb-2">{name}</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{description}</p>
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-md p-3 mb-4">
            <code className="text-sm text-neutral-600 dark:text-neutral-400">{usage}</code>
          </div>
          {options.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-black dark:text-white">Options:</p>
              <ul className="space-y-1">
                {options.map((opt, i) => (
                  <li key={i} className="text-sm text-neutral-600 dark:text-neutral-400">
                    <code className="bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded text-xs">{opt.flag}</code>
                    {' '}- {opt.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-2">Example:</p>
            <code className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 rounded block">{example}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

function UseCaseCard({
  title,
  description,
  example,
}: {
  title: string;
  description: string;
  example: string;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-black">
      <h3 className="text-xl font-normal text-black dark:text-white mb-2">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 mb-4">{description}</p>
      <CodeBlock language="bash" code={example} />
    </div>
  );
}
