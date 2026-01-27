import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'FAQ - AI Summit Help',
  description: 'Frequently asked questions about AI Summit',
};

export default function FAQPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground">
          Find answers to common questions about using AI Summit.
        </p>
      </div>

      {/* Getting Started */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Getting Started
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="What is AI Summit?"
            answer="AI Summit is a documentation management platform that helps teams organize, version control, and audit their documentation. It includes AI-powered features like automated quality checks, MCP integration with Claude Desktop, and intelligent document assistance."
          />
          <FAQItem
            question="Do I need to create an account to use AI Summit?"
            answer="Yes, you need to create an account to use AI Summit. Sign up with your email address, verify it, and you can start creating projects immediately. We offer a free tier to get you started."
          />
          <FAQItem
            question="How much does AI Summit cost?"
            answer="AI Summit offers a free tier with basic features. For advanced features like unlimited projects, team collaboration, and priority support, check our pricing page for current plans."
          />
          <FAQItem
            question="Can I import existing documentation?"
            answer="Yes! You can create documents manually through the UI or use our CLI tool to sync documentation from your local file system or Git repositories."
          />
        </div>
      </section>

      {/* Projects & Documents */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Projects & Documents
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="How many projects can I create?"
            answer="The number of projects you can create depends on your plan. Free tier users can create up to 3 projects, while paid plans offer unlimited projects."
          />
          <FAQItem
            question="What document types are supported?"
            answer="AI Summit supports various document types including Architecture Docs, API Contracts, Feature Specs, User Guides, Technical Specs, ADRs (Architectural Decision Records), and more. You can also create custom document types."
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
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Team Collaboration
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="How do I invite team members?"
            answer="Go to your project settings, navigate to the Members tab, and click 'Invite Member'. Enter their email address and choose their role (Owner, Editor, or Viewer). They'll receive an invitation email."
          />
          <FAQItem
            question="What are the different user roles?"
            answer={
              <div>
                <p className="mb-2">AI Summit has three user roles:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong>Owner:</strong> Full access including project deletion, member management, and billing</li>
                  <li><strong>Editor:</strong> Can create, edit, and delete documents, create proposals, and run audits</li>
                  <li><strong>Viewer:</strong> Read-only access to documents and project information</li>
                </ul>
              </div>
            }
          />
          <FAQItem
            question="How does version control work?"
            answer="AI Summit uses a proposal-based revision system. When you want to change a document, you create a proposal (revision), make your changes, and submit for approval. Editors and Owners can approve or reject proposals. Once approved, changes are merged into the main document."
          />
          <FAQItem
            question="Can I see who made changes to a document?"
            answer="Yes! Each document maintains a complete revision history showing who made changes, when they were made, and what was changed. You can view this in the document's history section."
          />
        </div>
      </section>

      {/* MCP Integration */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          MCP Integration
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="What is MCP?"
            answer={
              <div>
                <p className="mb-2">
                  MCP (Model Context Protocol) is a standard for connecting AI assistants like Claude to external data sources.
                  With AI Summit's MCP integration, Claude Desktop can:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Read and search your documentation</li>
                  <li>Answer questions based on your docs</li>
                  <li>Propose changes to documents</li>
                  <li>Access grounded knowledge and decisions</li>
                </ul>
              </div>
            }
          />
          <FAQItem
            question="How do I set up MCP with Claude Desktop?"
            answer={
              <div>
                <p className="mb-2">Setting up MCP integration involves a few steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4 text-sm">
                  <li>Generate an API key in your project settings</li>
                  <li>Locate your Claude Desktop config file</li>
                  <li>Add AI Summit configuration with your API key</li>
                  <li>Restart Claude Desktop</li>
                </ol>
                <p className="mt-2">
                  See our <Link href="/help/api/mcp" className="text-primary hover:underline">MCP Integration Guide</Link> for detailed instructions.
                </p>
              </div>
            }
          />
          <FAQItem
            question="Is MCP integration secure?"
            answer="Yes! MCP integration uses API keys for authentication, and all communication is encrypted over HTTPS. API keys can be revoked at any time from your project settings. You control which projects Claude can access by configuring specific API keys."
          />
          <FAQItem
            question="Can I use MCP with other AI tools?"
            answer="Currently, AI Summit's MCP integration is designed for Claude Desktop. However, MCP is an open standard, and we're exploring support for other AI tools in the future."
          />
        </div>
      </section>

      {/* AI Features */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          AI Features
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="What AI features are available?"
            answer={
              <div>
                <p className="mb-2">AI Summit includes several AI-powered features:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong>Document Chat:</strong> Ask questions about your documents and get AI-powered answers</li>
                  <li><strong>Automated Audits:</strong> Check documentation quality, consistency, and freshness</li>
                  <li><strong>Smart Suggestions:</strong> Get AI recommendations for improving your documentation</li>
                  <li><strong>MCP Integration:</strong> Connect Claude Desktop to your documentation</li>
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
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Troubleshooting
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="I can't see my project after creating it"
            answer="Try refreshing the page. If the project still doesn't appear, check that you're logged into the correct account. If the issue persists, contact support with your account email and project name."
          />
          <FAQItem
            question="Why isn't my API key working?"
            answer={
              <div>
                <p className="mb-2">Common reasons for API key failures:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>The API key format is incorrect (should be: dj_proj_{'<project-id>_<random-string>'})</li>
                  <li>The API key has been deleted or revoked</li>
                  <li>The API key doesn't have necessary permissions</li>
                  <li>The project URL in your configuration is incorrect</li>
                </ul>
                <p className="mt-2">Try regenerating a new API key from project settings.</p>
              </div>
            }
          />
          <FAQItem
            question="Claude Desktop can't see my documentation"
            answer={
              <div>
                <p className="mb-2">Check these items:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Verify your API key is correct in the Claude Desktop config file</li>
                  <li>Ensure you restarted Claude Desktop after updating the config</li>
                  <li>Check that the project URL is correct and accessible</li>
                  <li>Verify the config file JSON syntax is valid</li>
                </ul>
                <p className="mt-2">
                  See our <Link href="/help/api/mcp" className="text-primary hover:underline">MCP troubleshooting section</Link> for more details.
                </p>
              </div>
            }
          />
          <FAQItem
            question="How do I report a bug or request a feature?"
            answer={
              <div>
                <p className="mb-2">
                  We welcome bug reports and feature requests! You can:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Contact support through the help widget in the app</li>
                  <li>Email us at support@ai-summit.com</li>
                  <li>Submit an issue on our GitHub repository (if available)</li>
                </ul>
              </div>
            }
          />
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
        <div className="bg-accent/50 border rounded-lg p-6">
          <p className="mb-4">
            Can't find the answer you're looking for? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/help/support"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center justify-center px-4 py-2 border border-input text-sm font-medium rounded-md hover:bg-accent transition-colors"
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
    <details className="group border rounded-lg">
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
        <h3 className="font-semibold text-base pr-4">{question}</h3>
        <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform flex-shrink-0" />
      </summary>
      <div className="px-4 pb-4 pt-2 text-muted-foreground text-sm border-t">
        {typeof answer === 'string' ? <p>{answer}</p> : answer}
      </div>
    </details>
  );
}
