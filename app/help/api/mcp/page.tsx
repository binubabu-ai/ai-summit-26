import Link from 'next/link';
import { Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { CodeBlock } from '@/components/help/CodeBlock';

export const metadata = {
  title: 'MCP Integration - AI Summit Help',
  description: 'Connect Claude Desktop to your AI Summit documentation via Model Context Protocol',
};

export default function MCPIntegrationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">MCP Integration with Claude Desktop</h1>
        <p className="text-xl text-muted-foreground">
          Connect Claude Desktop to your AI Summit documentation using the Model Context Protocol (MCP).
        </p>
      </div>

      {/* What is MCP */}
      <section>
        <h2 className="text-2xl font-bold mb-4">What is MCP?</h2>
        <p className="text-muted-foreground mb-4">
          The <strong>Model Context Protocol (MCP)</strong> is a standard for connecting AI assistants like Claude to external data sources. With MCP, Claude can:
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Read and search your documentation directly</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Propose changes and improvements to documents</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Answer questions based on your specific documentation</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Access grounded knowledge and decision records</span>
          </li>
        </ul>
      </section>

      {/* Setup Instructions */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Setup Instructions</h2>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="relative pl-8 border-l-2 border-primary/20 pb-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">Step 1: Generate an API Key</h3>
            <p className="text-muted-foreground mb-4">
              First, you need an API key to authenticate Claude Desktop with your project:
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground mb-4 list-decimal list-inside">
              <li>Go to your <strong>Project Settings → API Keys</strong></li>
              <li>Click <strong>"Generate New API Key"</strong></li>
              <li>Give it a name (e.g., "Claude Desktop")</li>
              <li>Copy the API key (you won't see it again!)</li>
            </ol>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
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
          <div className="relative pl-8 border-l-2 border-primary/20 pb-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">Step 2: Locate Claude Desktop Config File</h3>
            <p className="text-muted-foreground mb-4">
              Find your Claude Desktop configuration file:
            </p>
            <div className="space-y-3 text-sm">
              <div className="bg-muted rounded-lg p-4">
                <p className="font-semibold mb-2">macOS:</p>
                <code className="text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="font-semibold mb-2">Windows:</p>
                <code className="text-xs">%APPDATA%\Claude\claude_desktop_config.json</code>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="font-semibold mb-2">Linux:</p>
                <code className="text-xs">~/.config/Claude/claude_desktop_config.json</code>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative pl-8 border-l-2 border-primary/20 pb-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">Step 3: Update the Configuration</h3>
            <p className="text-muted-foreground mb-4">
              Add your AI Summit project to the MCP servers configuration:
            </p>
            <CodeBlock
              language="json"
              code={`{
  "mcpServers": {
    "ai-summit": {
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
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Replace the following values:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">YOUR_API_KEY_HERE</code> with your API key from Step 1</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">your-domain.com</code> with your AI Summit instance URL</li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative pl-8 border-l-2 border-primary/20">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">Step 4: Restart Claude Desktop</h3>
            <p className="text-muted-foreground mb-4">
              Close and reopen Claude Desktop for the changes to take effect.
            </p>
            <div className="bg-accent/50 border rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">✅ Verification:</p>
              <p className="text-muted-foreground">
                Once connected, you should see "ai-summit" listed in Claude's available tools. You can ask Claude to search your documentation or read specific documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Tools */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Available MCP Tools</h2>
        <p className="text-muted-foreground mb-6">
          Once connected, Claude can use these tools to interact with your documentation:
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
        <h2 className="text-2xl font-bold mb-4">Example Prompts</h2>
        <p className="text-muted-foreground mb-6">
          Try these prompts with Claude once MCP is configured:
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
      <section className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Troubleshooting</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Claude can't see my documentation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Verify your API key is correct in the config file</li>
              <li>• Check that you restarted Claude Desktop after updating the config</li>
              <li>• Ensure your API key has the necessary permissions</li>
              <li>• Check that the project URL is correct and accessible</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Authentication errors</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• API key format should be: <code className="bg-muted px-1 py-0.5 rounded text-xs">dj_proj_{'<project-id>_<random-string>'}</code></li>
              <li>• Make sure the API key hasn't been deleted or expired</li>
              <li>• Regenerate a new API key if needed</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Tools not appearing</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Check the Claude Desktop config file syntax (must be valid JSON)</li>
              <li>• Restart Claude Desktop completely (not just the window)</li>
              <li>• Check Claude Desktop logs for error messages</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-muted rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">Still having issues?</p>
          <p className="text-muted-foreground">
            Visit our <Link href="/help/troubleshooting" className="text-primary hover:underline">troubleshooting guide</Link> or{' '}
            <Link href="/help/support" className="text-primary hover:underline">contact support</Link> for assistance.
          </p>
        </div>
      </section>

      {/* Next Steps */}
      <section className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
        <div className="grid gap-3">
          <Link
            href="/help/api/rest"
            className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all group"
          >
            <div>
              <h3 className="font-semibold mb-1 group-hover:text-primary">REST API Reference</h3>
              <p className="text-sm text-muted-foreground">Explore the full API documentation</p>
            </div>
          </Link>
          <Link
            href="/help/guides/ai-features"
            className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all group"
          >
            <div>
              <h3 className="font-semibold mb-1 group-hover:text-primary">AI Features Guide</h3>
              <p className="text-sm text-muted-foreground">Learn about other AI-powered features</p>
            </div>
          </Link>
        </div>
      </section>
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
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Terminal className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-mono font-semibold text-sm mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <div className="bg-accent/50 rounded-md p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Example:</p>
            <p className="italic">"{example}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamplePrompt({ category, prompt }: { category: string; prompt: string }) {
  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium h-fit">
        {category}
      </div>
      <p className="text-sm flex-1 italic">"{prompt}"</p>
    </div>
  );
}
