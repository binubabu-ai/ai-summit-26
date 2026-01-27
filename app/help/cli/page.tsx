import Link from 'next/link';
import { Terminal, Package, GitBranch, RefreshCw, Server, ListTree, Trash2, Eye, Key, CheckCircle2, ArrowRight } from 'lucide-react';
import { CodeBlock } from '@/components/help/CodeBlock';

export const metadata = {
  title: 'CLI Tool - Docjays Help',
  description: 'DocJays CLI for managing documentation sources and MCP integration',
};

export default function CLIPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-6">
          DocJays CLI
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light max-w-3xl">
          Command-line tool for managing documentation sources in your projects while keeping them separate from your main codebase.
        </p>
      </div>

      {/* What is DocJays CLI */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">What is DocJays CLI?</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
          DocJays CLI is a command-line tool that helps you manage documentation sources in your projects. Perfect for client projects where you want to maintain company standards, API docs, and architecture references without committing them to the client's repository.
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

        {/* GitHub Packages Installation */}
        <div className="mb-8">
          <h3 className="text-xl font-normal text-black dark:text-white mb-4">From GitHub Packages (Recommended for Teams)</h3>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            For internal team use, install from GitHub Packages:
          </p>

          <p className="text-sm font-medium text-black dark:text-white mb-2">Step 1: One-time setup</p>
          <CodeBlock
            language="bash"
            code={`# Configure npm to use GitHub Packages for @binubabu-ai scope
echo "@binubabu-ai:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Authenticate (requires GitHub Personal Access Token with read:packages scope)
npm login --scope=@binubabu-ai --registry=https://npm.pkg.github.com`}
          />

          <p className="text-sm font-medium text-black dark:text-white mb-2 mt-4">Step 2: Install</p>
          <CodeBlock
            language="bash"
            code="npm install -g @binubabu-ai/docjays"
          />

          <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Need a Personal Access Token?</strong><br />
              Create one at GitHub Settings → Developer settings → Personal access tokens<br />
              Required scopes: <code className="text-xs bg-white dark:bg-black px-2 py-1 rounded">read:packages</code>
            </p>
          </div>
        </div>

        {/* npm Registry Installation */}
        <div className="mb-8">
          <h3 className="text-xl font-normal text-black dark:text-white mb-4">From npm (Public)</h3>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            Install DocJays CLI globally via npm:
          </p>
          <CodeBlock
            language="bash"
            code="npm install -g docjays"
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
          code={`# Initialize DocJays in your project
docjays init

# Add documentation sources
docjays add-source --name company-docs --type git --url https://github.com/myorg/docs
docjays add-source --name api-specs --type git --url https://github.com/myorg/api-specs

# Sync all documentation
docjays sync

# Start MCP server for Claude
docjays serve`}
        />
      </section>

      {/* Commands */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-12">Commands</h2>

        <div className="space-y-8">
          <CommandCard
            icon={<Package className="w-5 h-5" />}
            name="init"
            description="Initialize DocJays in your project"
            usage="docjays init [options]"
            options={[
              { flag: '-y, --yes', description: 'Skip prompts and use defaults' },
              { flag: '--no-gitignore', description: 'Skip updating .gitignore' },
            ]}
            example="docjays init --yes"
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
            description="Show DocJays status and statistics"
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
            icon={<Eye className="w-5 h-5" />}
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
            icon={<Key className="w-5 h-5" />}
            name="auth"
            description="Manage encrypted credentials for private repositories"
            usage="docjays auth <action> [options]"
            options={[
              { flag: 'init', description: 'Initialize keystore with master password' },
              { flag: 'add <name>', description: 'Add a new credential' },
              { flag: 'list', description: 'List all stored credentials' },
              { flag: 'remove <name>', description: 'Remove a credential' },
              { flag: 'update <name>', description: 'Update a credential' },
              { flag: 'rotate-password', description: 'Change master password' },
              { flag: 'export [file]', description: 'Export keystore (encrypted)' },
              { flag: 'import <file>', description: 'Import keystore' },
              { flag: 'destroy', description: 'Delete keystore (destructive)' },
            ]}
            example="docjays auth add github-token"
          />
        </div>
      </section>

      {/* MCP Integration */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">MCP Integration</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
          To use DocJays CLI with Claude Desktop, add this to your MCP settings:
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
            After updating the config, restart Claude Desktop. DocJays will expose your local documentation to Claude via MCP.
          </p>
        </div>
      </section>

      {/* Authentication Workflow */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Working with Private Repositories</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
          DocJays includes an encrypted keystore for managing credentials to private repositories:
        </p>
        <CodeBlock
          language="bash"
          code={`# Initialize keystore
docjays auth init

# Add GitHub token
docjays auth add github-token

# Add source with authentication
docjays add-source --name private-docs \\
  --type git \\
  --url https://github.com/myorg/private-docs \\
  --auth github-token

# Sync (will prompt for keystore password)
docjays sync`}
        />
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
