import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'FAQ - Docjays Help',
  description: 'Frequently asked questions about Docjays',
};

export default function FAQPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-6">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light max-w-3xl">
          Find answers to common questions about using Docjays.
        </p>
      </div>

      {/* Getting Started */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Getting Started</h2>
        <div className="space-y-3">
          <FAQItem
            question="What is Docjays?"
            answer="Docjays is a documentation management platform that helps teams organize, version control, and audit their documentation. It includes AI-powered features like automated quality checks, MCP integration with AI assistants, CLI tool for documentation management, and intelligent document assistance."
          />
          <FAQItem
            question="Do I need to create an account to use Docjays?"
            answer="Yes, you need to create an account to use the web application. Sign up with your email address, verify it, and you can start creating projects immediately. The CLI tool can be used locally without an account, but requires an API key to sync with the web platform."
          />
          <FAQItem
            question="How much does Docjays cost?"
            answer="Docjays offers a free tier with basic features. For advanced features like unlimited projects, team collaboration, and priority support, check our pricing page for current plans."
          />
          <FAQItem
            question="Can I import existing documentation?"
            answer="Yes! You can create documents manually through the UI, or use the Docjays CLI tool to sync documentation from your local file system, Git repositories, or HTTP URLs."
          />
        </div>
      </section>

      {/* CLI Tool */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">CLI Tool</h2>
        <div className="space-y-3">
          <FAQItem
            question="What is the Docjays CLI?"
            answer={
              <div>
                <p className="mb-3">
                  Docjays CLI is a command-line tool for managing documentation sources in your projects while keeping them separate from your main codebase. It's perfect for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Syncing documentation from Git repos, HTTP URLs, or local paths</li>
                  <li>Exposing local docs to Claude via MCP</li>
                  <li>Auto-syncing documentation at regular intervals</li>
                  <li>Managing multiple documentation sources</li>
                  <li>Keeping documentation out of your repository (.docjays/ is git-ignored)</li>
                </ul>
                <p className="mt-3">
                  See our <Link href="/help/cli" className="text-black dark:text-white underline hover:no-underline">CLI Tool Guide</Link> for complete documentation.
                </p>
              </div>
            }
          />
          <FAQItem
            question="How do I install the CLI?"
            answer={
              <div>
                <p className="mb-3 font-medium text-black dark:text-white">For Team Members (GitHub Packages):</p>
                <p className="mb-2 text-sm">One-time setup:</p>
                <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-2">
                  echo "@techjays:registry=https://npm.pkg.github.com" &gt;&gt; ~/.npmrc
                </code>
                <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-3">
                  npm login --scope=@techjays --registry=https://npm.pkg.github.com
                </code>
                <p className="mb-2 text-sm">Then install:</p>
                <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-4">
                  npm install -g @techjays/docjays
                </code>

                <p className="mb-2 font-medium text-black dark:text-white">From npm (Public):</p>
                <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-2">
                  npm install -g docjays
                </code>
                <p className="text-sm mt-3">Or use without installation:</p>
                <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mt-2">
                  npx docjays init
                </code>
                <p className="mt-3 text-sm">
                  See our <Link href="/help/cli" className="text-black dark:text-white underline hover:no-underline">CLI Tool Guide</Link> for detailed instructions.
                </p>
              </div>
            }
          />
          <FAQItem
            question="Can I use the CLI with private repositories?"
            answer="Yes! The CLI includes an encrypted keystore for managing credentials. Use 'docjays auth init' to set up the keystore, then 'docjays auth add' to store tokens for private repositories. All credentials are encrypted with AES-256-GCM."
          />
          <FAQItem
            question="Does the CLI work offline?"
            answer="Yes, the CLI can work with local documentation sources without an internet connection. However, syncing from Git repos or HTTP URLs requires connectivity, and MCP integration requires the AI assistant to be running."
          />
        </div>
      </section>

      {/* Projects & Documents */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Projects & Documents</h2>
        <div className="space-y-3">
          <FAQItem
            question="How many projects can I create?"
            answer="The number of projects you can create depends on your plan. Free tier users can create up to 3 projects, while paid plans offer unlimited projects."
          />
          <FAQItem
            question="What document types are supported?"
            answer="Docjays supports various document types including Architecture Docs, API Contracts, Feature Specs, User Guides, Technical Specs, ADRs (Architectural Decision Records), and more. You can also create custom document types."
          />
          <FAQItem
            question="Can I organize documents into folders?"
            answer="Yes! Documents are organized using a file-path structure (e.g., /api/authentication.md, /guides/getting-started.md) which creates a natural folder hierarchy."
          />
          <FAQItem
            question="Is there a limit to document size?"
            answer="Individual documents can be up to 1MB in size on the free tier, and up to 5MB on paid plans. For larger documentation needs, consider splitting content across multiple documents."
          />
        </div>
      </section>

      {/* Collaboration */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Team Collaboration</h2>
        <div className="space-y-3">
          <FAQItem
            question="How do I invite team members?"
            answer="Go to your project settings, navigate to the Members tab, and click 'Invite Member'. Enter their email address and choose their role (Owner, Editor, or Viewer). They'll receive an invitation email."
          />
          <FAQItem
            question="What are the different user roles?"
            answer={
              <div>
                <p className="mb-3">Docjays has three user roles:</p>
                <ul className="space-y-2">
                  <li><strong className="text-black dark:text-white">Owner:</strong> Full access including project deletion, member management, and billing</li>
                  <li><strong className="text-black dark:text-white">Editor:</strong> Can create, edit, and delete documents, create proposals, and run audits</li>
                  <li><strong className="text-black dark:text-white">Viewer:</strong> Read-only access to documents and project information</li>
                </ul>
              </div>
            }
          />
          <FAQItem
            question="How does version control work?"
            answer="Docjays uses a proposal-based revision system. When you want to change a document, you create a proposal (revision), make your changes, and submit for approval. Editors and Owners can approve or reject proposals. Once approved, changes are merged into the main document."
          />
          <FAQItem
            question="Can I see who made changes to a document?"
            answer="Yes! Each document maintains a complete revision history showing who made changes, when they were made, and what was changed. You can view this in the document's history section."
          />
        </div>
      </section>

      {/* MCP Integration */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">MCP Integration</h2>
        <div className="space-y-3">
          <FAQItem
            question="What is MCP?"
            answer={
              <div>
                <p className="mb-3">
                  MCP (Model Context Protocol) is a standard for connecting AI assistants to external data sources.
                  With Docjays' MCP integration, your AI assistant can:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Read and search your documentation</li>
                  <li>Answer questions based on your docs</li>
                  <li>Propose changes to documents</li>
                  <li>Access grounded knowledge and decisions</li>
                </ul>
              </div>
            }
          />
          <FAQItem
            question="Which AI assistants work with Docjays?"
            answer={
              <div>
                <p className="mb-3">Docjays MCP integration works with multiple AI assistants:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-black dark:text-white">Claude Desktop</strong> - Official desktop app (macOS, Windows)</li>
                  <li><strong className="text-black dark:text-white">Cursor</strong> - AI code editor (all platforms)</li>
                  <li><strong className="text-black dark:text-white">Windsurf</strong> - Collaborative IDE (all platforms)</li>
                  <li><strong className="text-black dark:text-white">Claude Code CLI</strong> - Terminal-based assistant (all platforms)</li>
                  <li><strong className="text-black dark:text-white">VS Code</strong> - With Continue extension (all platforms)</li>
                </ul>
                <p className="mt-3">
                  See our <Link href="/help/api/mcp" className="text-black dark:text-white underline hover:no-underline">MCP Integration Guide</Link> for setup instructions for each assistant.
                </p>
              </div>
            }
          />
          <FAQItem
            question="How do I set up MCP integration?"
            answer={
              <div>
                <p className="mb-3">Setting up MCP integration involves a few steps:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Generate an API key in your project settings</li>
                  <li>Locate your AI assistant's config file</li>
                  <li>Add Docjays configuration with your API key</li>
                  <li>Restart your AI assistant</li>
                </ol>
                <p className="mt-3">
                  See our <Link href="/help/api/mcp" className="text-black dark:text-white underline hover:no-underline">MCP Integration Guide</Link> for detailed instructions for your specific AI assistant.
                </p>
              </div>
            }
          />
          <FAQItem
            question="Is MCP integration secure?"
            answer="Yes! MCP integration uses API keys for authentication, and all communication is encrypted over HTTPS. API keys can be revoked at any time from your project settings. You control which projects your AI assistant can access by configuring specific API keys."
          />
          <FAQItem
            question="Can I use MCP with local documentation (CLI)?"
            answer={
              <div>
                <p className="mb-2">
                  Yes! The Docjays CLI includes built-in MCP server support. Run:
                </p>
                <code className="block bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-sm mb-3">
                  docjays serve
                </code>
                <p>
                  Then configure your AI assistant to use the CLI's MCP server. This exposes your local documentation to your AI assistant without needing to upload it to the web platform.
                </p>
              </div>
            }
          />
        </div>
      </section>

      {/* AI Features */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">AI Features</h2>
        <div className="space-y-3">
          <FAQItem
            question="What AI features are available?"
            answer={
              <div>
                <p className="mb-3">Docjays includes several AI-powered features:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-black dark:text-white">Document Chat:</strong> Ask questions about your documents and get AI-powered answers</li>
                  <li><strong className="text-black dark:text-white">Automated Audits:</strong> Check documentation quality, consistency, and freshness</li>
                  <li><strong className="text-black dark:text-white">Smart Suggestions:</strong> Get AI recommendations for improving your documentation</li>
                  <li><strong className="text-black dark:text-white">MCP Integration:</strong> Connect AI assistants directly to your documentation</li>
                </ul>
              </div>
            }
          />
          <FAQItem
            question="How do document audits work?"
            answer="Document audits use AI to analyze your documentation for quality issues like outdated content, inconsistencies, missing information, unclear language, and compliance violations. You can run audits manually or schedule them to run automatically."
          />
          <FAQItem
            question="Is my documentation data used to train AI models?"
            answer="No, your documentation is never used to train AI models. We use AI models to analyze and assist with your documentation, but your content remains private and is not shared with model providers for training purposes."
          />
        </div>
      </section>

      {/* Troubleshooting */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Troubleshooting</h2>
        <div className="space-y-3">
          <FAQItem
            question="I can't see my project after creating it"
            answer="Try refreshing the page. If the project still doesn't appear, check that you're logged into the correct account. If the issue persists, contact support with your account email and project name."
          />
          <FAQItem
            question="Why isn't my API key working?"
            answer={
              <div>
                <p className="mb-3">Common reasons for API key failures:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The API key format is incorrect (should be: dj_proj_{'<project-id>_<random-string>'})</li>
                  <li>The API key has been deleted or revoked</li>
                  <li>The API key doesn't have necessary permissions</li>
                  <li>The project URL in your configuration is incorrect</li>
                </ul>
                <p className="mt-3">Try regenerating a new API key from project settings.</p>
              </div>
            }
          />
          <FAQItem
            question="My AI assistant can't see my documentation"
            answer={
              <div>
                <p className="mb-3">Check these items:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verify your API key is correct in the config file</li>
                  <li>Ensure you restarted your AI assistant after updating the config</li>
                  <li>Check that the project URL is correct and accessible</li>
                  <li>Verify the config file JSON syntax is valid</li>
                </ul>
                <p className="mt-3">
                  See our <Link href="/help/api/mcp" className="text-black dark:text-white underline hover:no-underline">MCP troubleshooting section</Link> for more details.
                </p>
              </div>
            }
          />
          <FAQItem
            question="The CLI isn't syncing my documentation"
            answer={
              <div>
                <p className="mb-3">Common CLI sync issues:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Check that the source URL or path is correct</li>
                  <li>For Git sources, verify you have access (use 'docjays auth' for private repos)</li>
                  <li>Run 'docjays status' to check configuration</li>
                  <li>Try 'docjays sync --force' to force a fresh sync</li>
                  <li>Check logs in .docjays/logs/ for detailed error messages</li>
                </ul>
              </div>
            }
          />
          <FAQItem
            question="How do I report a bug or request a feature?"
            answer={
              <div>
                <p className="mb-3">
                  We welcome bug reports and feature requests! You can:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Contact support through the help widget in the app</li>
                  <li>Email us at support@docjays.com</li>
                  <li>Submit an issue on our GitHub repository</li>
                </ul>
              </div>
            }
          />
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-12">
        <h2 className="text-3xl font-light text-black dark:text-white mb-8">Still Have Questions?</h2>
        <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-8">
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
            Can't find the answer you're looking for? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/help"
              className="inline-flex items-center justify-center px-6 py-3 border border-neutral-200 dark:border-neutral-800 text-sm font-medium rounded-md text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              Browse Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
  return (
    <details className="group border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-black">
      <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
        <h3 className="font-normal text-lg text-black dark:text-white pr-4">{question}</h3>
        <ChevronDown className="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform flex-shrink-0" />
      </summary>
      <div className="px-6 pb-6 pt-2 text-neutral-600 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800">
        {typeof answer === 'string' ? <p>{answer}</p> : answer}
      </div>
    </details>
  );
}
