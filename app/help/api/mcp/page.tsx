import Link from 'next/link';
import { Terminal, CheckCircle2, AlertCircle, Sparkles, Code2, Wind, Boxes, ArrowRight } from 'lucide-react';
import { CodeBlock } from '@/components/help/CodeBlock';

export const metadata = {
  title: 'MCP Integration - Docjays Help',
  description: 'Connect AI assistants to your Docjays documentation via Model Context Protocol',
};

export default function MCPIntegrationPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-6">
          MCP Integration
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light max-w-3xl">
          Connect your AI assistant to Docjays documentation using the Model Context Protocol (MCP).
        </p>
      </div>

      {/* What is MCP */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">What is MCP?</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
          The <strong className="text-black dark:text-white">Model Context Protocol (MCP)</strong> is a standard for connecting AI assistants like Claude to external data sources. With MCP, your AI assistant can:
        </p>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">Read and search your documentation directly</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">Propose changes and improvements to documents</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">Answer questions based on your specific documentation</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">Access grounded knowledge and decision records</span>
          </li>
        </ul>
      </section>

      {/* Supported AI Assistants */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">Supported AI Assistants</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
          Docjays works with multiple AI assistants that support MCP:
        </p>
        <div className="grid gap-4">
          <IdeCard
            icon={<Sparkles className="w-5 h-5" />}
            name="Claude Desktop"
            description="Official Claude desktop application"
            platforms={['macOS', 'Windows']}
          />
          <IdeCard
            icon={<Code2 className="w-5 h-5" />}
            name="Cursor"
            description="AI-first code editor with built-in MCP support"
            platforms={['macOS', 'Windows', 'Linux']}
          />
          <IdeCard
            icon={<Wind className="w-5 h-5" />}
            name="Windsurf"
            description="Collaborative IDE with MCP integration"
            platforms={['macOS', 'Windows', 'Linux']}
          />
          <IdeCard
            icon={<Terminal className="w-5 h-5" />}
            name="Claude Code CLI"
            description="Terminal-based AI assistant"
            platforms={['macOS', 'Windows', 'Linux']}
          />
          <IdeCard
            icon={<Boxes className="w-5 h-5" />}
            name="VS Code (Continue)"
            description="Continue extension for Visual Studio Code"
            platforms={['macOS', 'Windows', 'Linux']}
          />
        </div>
      </section>

      {/* Setup Instructions for Claude Desktop */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-12">Setup Instructions</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-12">
          Follow these steps to connect Claude Desktop to your Docjays project:
        </p>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 1
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Generate an API Key</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              First, you need an API key to authenticate your AI assistant with your project:
            </p>
            <ol className="space-y-3 text-neutral-600 dark:text-neutral-400 list-decimal list-inside mb-6">
              <li>Go to your <strong className="text-black dark:text-white">Project Settings → API Keys</strong></li>
              <li>Click <strong className="text-black dark:text-white">"Generate New API Key"</strong></li>
              <li>Give it a name (e.g., "Claude Desktop")</li>
              <li>Copy the API key (you won't see it again!)</li>
            </ol>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                    Important: Save Your API Key
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    The API key is only shown once. Store it securely (e.g., in a password manager).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 2
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Locate Config File</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              Find your Claude Desktop configuration file:
            </p>
            <div className="space-y-3">
              <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                <p className="font-medium text-black dark:text-white mb-2">macOS:</p>
                <code className="text-sm text-neutral-600 dark:text-neutral-400">~/Library/Application Support/Claude/claude_desktop_config.json</code>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                <p className="font-medium text-black dark:text-white mb-2">Windows:</p>
                <code className="text-sm text-neutral-600 dark:text-neutral-400">%APPDATA%\Claude\claude_desktop_config.json</code>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                <p className="font-medium text-black dark:text-white mb-2">Linux:</p>
                <code className="text-sm text-neutral-600 dark:text-neutral-400">~/.config/Claude/claude_desktop_config.json</code>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 3
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Update Configuration</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              Add your Docjays project to the MCP servers configuration:
            </p>
            <CodeBlock
              language="json"
              code={`{
  "mcpServers": {
    "docjays": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Authorization: Bearer YOUR_API_KEY_HERE",
        "-H", "Content-Type: application/json",
        "https://your-domain.com/api/mcp"
      ]
    }
  }
}`}
            />
            <div className="mt-6 space-y-2 text-neutral-600 dark:text-neutral-400">
              <p>Replace the following values:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><code className="text-sm bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">YOUR_API_KEY_HERE</code> with your API key from Step 1</li>
                <li><code className="text-sm bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">your-domain.com</code> with your Docjays instance URL</li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 4
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Restart Claude Desktop</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              Close and reopen Claude Desktop for the changes to take effect.
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
              <p className="font-medium text-black dark:text-white mb-2">✅ Verification:</p>
              <p className="text-neutral-600 dark:text-neutral-400">
                Once connected, you should see "docjays" listed in Claude's available tools. You can ask Claude to search your documentation or read specific documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Other IDE Setup */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">Other IDE Setup</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
          Configuration steps are similar for other AI assistants. Each has its own config location:
        </p>

        <div className="space-y-6">
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-black">
            <div className="flex items-start gap-4">
              <Code2 className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-normal text-black dark:text-white mb-2">Cursor</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                  <strong className="text-black dark:text-white">Config Location:</strong> Settings → MCP Servers
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Open Cursor settings, navigate to MCP Servers, click "Add Server", and paste your configuration.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-black">
            <div className="flex items-start gap-4">
              <Wind className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-normal text-black dark:text-white mb-2">Windsurf</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                  <strong className="text-black dark:text-white">Config Location:</strong> MCP → Servers → Add Server
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Navigate to MCP settings, add a new server, and configure with your API key.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-black">
            <div className="flex items-start gap-4">
              <Terminal className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-normal text-black dark:text-white mb-2">Claude Code CLI</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                  <strong className="text-black dark:text-white">Config Location:</strong> ~/.config/claude-code/mcp.json
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Edit the MCP configuration file and add your Docjays server configuration.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-black">
            <div className="flex items-start gap-4">
              <Boxes className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-normal text-black dark:text-white mb-2">VS Code (Continue)</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                  <strong className="text-black dark:text-white">Config Location:</strong> VS Code Settings → Extensions → Continue
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Install the Continue extension, open its settings, and add your MCP server configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Tools */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">Available MCP Tools</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
          Once connected, your AI assistant can use these tools to interact with your documentation:
        </p>
        <div className="space-y-4">
          <ToolCard
            name="read_document"
            description="Read the contents of a specific document"
            example='Can you read the API authentication document?'
          />
          <ToolCard
            name="search_documents"
            description="Search across all documents for specific keywords or topics"
            example='Search for information about JWT tokens in my docs'
          />
          <ToolCard
            name="list_documents"
            description="List all available documents in the project"
            example='Show me all the documents in this project'
          />
          <ToolCard
            name="propose_change"
            description="Propose an edit or improvement to a document"
            example='Propose an update to improve the authentication guide'
          />
          <ToolCard
            name="query_grounded_knowledge"
            description="Query grounded knowledge modules for specific information"
            example='What are the grounded decisions about our authentication approach?'
          />
        </div>
      </section>

      {/* Example Prompts */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">Example Prompts</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
          Try these prompts with your AI assistant once MCP is configured:
        </p>
        <div className="space-y-3">
          <ExamplePrompt
            category="Search"
            prompt="Search my documentation for examples of error handling"
          />
          <ExamplePrompt
            category="Read"
            prompt="Read the architecture.md document and summarize the key decisions"
          />
          <ExamplePrompt
            category="Analyze"
            prompt="Review all API documentation and check for inconsistencies"
          />
          <ExamplePrompt
            category="Propose"
            prompt="Suggest improvements to the getting started guide based on best practices"
          />
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-12">
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Troubleshooting</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-normal text-black dark:text-white mb-3">AI assistant can't see my documentation</h3>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>• Verify your API key is correct in the config file</li>
              <li>• Check that you restarted your AI assistant after updating the config</li>
              <li>• Ensure your API key has the necessary permissions</li>
              <li>• Check that the project URL is correct and accessible</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-normal text-black dark:text-white mb-3">Authentication errors</h3>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>• API key format should be: <code className="bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded text-sm">dj_proj_{'<project-id>_<random-string>'}</code></li>
              <li>• Make sure the API key hasn't been deleted or expired</li>
              <li>• Regenerate a new API key if needed</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-normal text-black dark:text-white mb-3">Tools not appearing</h3>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
              <li>• Check the config file syntax (must be valid JSON)</li>
              <li>• Restart your AI assistant completely (not just the window)</li>
              <li>• Check logs for error messages</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
          <p className="font-medium text-black dark:text-white mb-2">Still having issues?</p>
          <p className="text-neutral-600 dark:text-neutral-400">
            Check our FAQ page for more help, or reach out through your project settings.
          </p>
        </div>
      </section>

      {/* Next Steps */}
      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-12">
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Next Steps</h2>
        <div className="space-y-4">
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
          <Link
            href="/help/getting-started"
            className="flex items-center justify-between p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group bg-white dark:bg-black"
          >
            <div>
              <h3 className="font-normal text-lg text-black dark:text-white mb-1">Getting Started Guide</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Learn the basics of Docjays</p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function IdeCard({
  icon,
  name,
  description,
  platforms,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  platforms: string[];
}) {
  return (
    <div className="flex items-start gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-black">
      <div className="text-black dark:text-white flex-shrink-0 mt-1">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-normal text-black dark:text-white mb-1">{name}</h3>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">{description}</p>
        <div className="flex gap-2">
          {platforms.map((platform) => (
            <span key={platform} className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 rounded">
              {platform}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  name,
  description,
  example,
}: {
  name: string;
  description: string;
  example: string;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-white dark:bg-black">
      <div className="flex items-start gap-4">
        <Terminal className="w-5 h-5 text-black dark:text-white mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-mono font-medium text-black dark:text-white mb-2">{name}</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{description}</p>
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-md p-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-2">Example:</p>
            <p className="text-neutral-600 dark:text-neutral-400 italic">"{example}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamplePrompt({ category, prompt }: { category: string; prompt: string }) {
  return (
    <div className="flex gap-3 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-black">
      <div className="px-3 py-1 bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white rounded text-xs font-medium h-fit">
        {category}
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 flex-1 italic">"{prompt}"</p>
    </div>
  );
}
