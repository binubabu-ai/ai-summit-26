import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Getting Started - Docjays Help',
  description: 'Learn how to create your first project and start managing documentation',
};

export default function GettingStartedPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-6">
          Getting Started
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light max-w-3xl">
          Learn how to create your first project and start managing documentation in minutes.
        </p>
      </div>

      {/* What is Docjays */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-6">What is Docjays?</h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
          Docjays is a powerful documentation management platform that helps teams:
        </p>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Organize</strong> documentation across projects with a structured approach
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Version control</strong> documents with proposal and approval workflows
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Audit</strong> documentation for quality, consistency, and freshness
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-lg text-neutral-600 dark:text-neutral-400">
              <strong className="text-black dark:text-white">Integrate with AI</strong> via MCP (Model Context Protocol) for Claude Desktop
            </span>
          </li>
        </ul>
      </section>

      {/* Step-by-Step Guide */}
      <section>
        <h2 className="text-3xl font-light text-black dark:text-white mb-12">Step-by-Step Guide</h2>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 1
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Create an Account</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
              Sign up for Docjays using your email address. You'll receive a verification email to confirm your account.
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
              <p className="font-medium text-black dark:text-white mb-2">💡 Pro Tip</p>
              <p className="text-neutral-600 dark:text-neutral-400">
                Use your work email to make it easier for team members to find and collaborate with you later.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 2
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Create Your First Project</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              From your dashboard, click the "New Project" button. Give your project a name and optional description.
            </p>
            <ul className="space-y-3 mb-6 text-neutral-600 dark:text-neutral-400">
              <li><strong className="text-black dark:text-white">Project Name:</strong> A descriptive name (e.g., "API Documentation", "Product Specifications")</li>
              <li><strong className="text-black dark:text-white">Slug:</strong> A URL-friendly identifier (auto-generated from name)</li>
              <li><strong className="text-black dark:text-white">Description:</strong> Brief overview of what this project contains</li>
            </ul>
            <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
              <p className="font-medium text-black dark:text-white mb-3">📖 Example</p>
              <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <p><strong className="text-black dark:text-white">Name:</strong> Customer Portal Documentation</p>
                <p><strong className="text-black dark:text-white">Slug:</strong> customer-portal</p>
                <p><strong className="text-black dark:text-white">Description:</strong> User guides and API docs for our customer portal</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 3
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Add Your First Document</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              Once inside your project, click "New Document" to create your first piece of documentation.
            </p>
            <ul className="space-y-3 text-neutral-600 dark:text-neutral-400">
              <li>• Choose a <strong className="text-black dark:text-white">document type</strong> (Architecture, API Contract, Feature Spec, etc.)</li>
              <li>• Set the <strong className="text-black dark:text-white">document path</strong> (e.g., /api/authentication.md)</li>
              <li>• Start writing using our rich text editor</li>
              <li>• Use the AI chat assistant for suggestions and improvements</li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 4
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Collaborate with Your Team</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              Invite team members from your project settings:
            </p>
            <ol className="space-y-3 text-neutral-600 dark:text-neutral-400 list-decimal list-inside">
              <li>Go to <strong className="text-black dark:text-white">Project Settings → Members</strong></li>
              <li>Click "Invite Member" and enter their email</li>
              <li>Choose their role (Owner, Editor, or Viewer)</li>
              <li>Send the invitation</li>
            </ol>
          </div>

          {/* Step 5 */}
          <div className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full mb-4">
                Step 5
              </span>
              <h3 className="text-2xl font-normal text-black dark:text-white">Explore Advanced Features</h3>
            </div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              Once you're comfortable with the basics, explore these powerful features:
            </p>
            <div className="grid gap-4">
              <FeatureCard
                title="Version Control"
                description="Create proposals, review changes, and approve revisions"
              />
              <FeatureCard
                title="AI Assistant"
                description="Get AI-powered suggestions and chat with your documents"
              />
              <FeatureCard
                title="Document Audits"
                description="Run automated quality checks and compliance audits"
              />
              <FeatureCard
                title="MCP Integration"
                description="Connect Claude Desktop to access your docs"
                href="/help/api/mcp"
              />
            </div>
          </div>
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
              <h3 className="font-normal text-lg text-black dark:text-white mb-1">Set Up MCP Integration</h3>
              <p className="text-neutral-600 dark:text-neutral-400">Connect Claude Desktop to your documentation</p>
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

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="w-2 h-2 rounded-full bg-black dark:bg-white flex-shrink-0 mt-2"></div>
      <div className="flex-1">
        <h4 className="font-normal text-black dark:text-white mb-1">{title}</h4>
        <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
      {href && <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-start gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group bg-white dark:bg-black"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-start gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-black">
      {content}
    </div>
  );
}
