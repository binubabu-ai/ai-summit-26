import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Getting Started - AI Summit Help',
  description: 'Learn how to create your first project and start managing documentation',
};

export default function GettingStartedPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Getting Started with AI Summit</h1>
        <p className="text-xl text-muted-foreground">
          Learn how to create your first project and start managing documentation in minutes.
        </p>
      </div>

      {/* What is AI Summit */}
      <section>
        <h2 className="text-2xl font-bold mb-4">What is AI Summit?</h2>
        <p className="text-muted-foreground mb-4">
          AI Summit is a powerful documentation management platform that helps teams:
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Organize</strong> documentation across projects with a structured approach
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Version control</strong> documents with proposal and approval workflows
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Audit</strong> documentation for quality, consistency, and freshness
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Integrate with AI</strong> via MCP (Model Context Protocol) for Claude Desktop
            </span>
          </li>
        </ul>
      </section>

      {/* Step-by-Step Guide */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Step-by-Step Guide</h2>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="relative pl-8 border-l-2 border-primary/20 pb-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">1. Create an Account</h3>
            <p className="text-muted-foreground mb-4">
              Sign up for AI Summit using your email address. You'll receive a verification email to confirm your account.
            </p>
            <div className="bg-accent/50 border rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">💡 Pro Tip:</p>
              <p className="text-muted-foreground">
                Use your work email to make it easier for team members to find and collaborate with you later.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative pl-8 border-l-2 border-primary/20 pb-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">2. Create Your First Project</h3>
            <p className="text-muted-foreground mb-4">
              From your dashboard, click the "New Project" button. Give your project a name and optional description.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li>• <strong>Project Name:</strong> A descriptive name (e.g., "API Documentation", "Product Specifications")</li>
              <li>• <strong>Slug:</strong> A URL-friendly identifier (auto-generated from name)</li>
              <li>• <strong>Description:</strong> Brief overview of what this project contains</li>
            </ul>
            <div className="bg-accent/50 border rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">📖 Example:</p>
              <p className="text-muted-foreground">
                <strong>Name:</strong> Customer Portal Documentation<br />
                <strong>Slug:</strong> customer-portal<br />
                <strong>Description:</strong> User guides and API docs for our customer portal
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative pl-8 border-l-2 border-primary/20 pb-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">3. Add Your First Document</h3>
            <p className="text-muted-foreground mb-4">
              Once inside your project, click "New Document" to create your first piece of documentation.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li>• Choose a <strong>document type</strong> (Architecture, API Contract, Feature Spec, etc.)</li>
              <li>• Set the <strong>document path</strong> (e.g., /api/authentication.md)</li>
              <li>• Start writing using our rich text editor</li>
              <li>• Use the AI chat assistant for suggestions and improvements</li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="relative pl-8 border-l-2 border-primary/20 pb-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">4. Collaborate with Your Team</h3>
            <p className="text-muted-foreground mb-4">
              Invite team members from your project settings:
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground mb-4 list-decimal list-inside">
              <li>Go to <strong>Project Settings → Members</strong></li>
              <li>Click "Invite Member" and enter their email</li>
              <li>Choose their role (Owner, Editor, or Viewer)</li>
              <li>Send the invitation</li>
            </ol>
          </div>

          {/* Step 5 */}
          <div className="relative pl-8 border-l-2 border-primary/20">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
            <h3 className="text-xl font-semibold mb-3">5. Explore Advanced Features</h3>
            <p className="text-muted-foreground mb-4">
              Once you're comfortable with the basics, explore these powerful features:
            </p>
            <div className="grid gap-3">
              <FeatureCard
                title="Version Control"
                description="Create proposals, review changes, and approve revisions"
                href="/help/guides/revisions"
              />
              <FeatureCard
                title="AI Assistant"
                description="Get AI-powered suggestions and chat with your documents"
                href="/help/guides/ai-features"
              />
              <FeatureCard
                title="Document Audits"
                description="Run automated quality checks and compliance audits"
                href="/help/guides/audit"
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
      <section className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
        <div className="grid gap-4">
          <Link
            href="/help/guides/documents"
            className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all group"
          >
            <div>
              <h3 className="font-semibold mb-1 group-hover:text-primary">Document Management Guide</h3>
              <p className="text-sm text-muted-foreground">Learn how to organize and edit documents</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
          <Link
            href="/help/api/mcp"
            className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all group"
          >
            <div>
              <h3 className="font-semibold mb-1 group-hover:text-primary">Set Up MCP Integration</h3>
              <p className="text-sm text-muted-foreground">Connect Claude Desktop to your documentation</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
          <Link
            href="/help/faq"
            className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all group"
          >
            <div>
              <h3 className="font-semibold mb-1 group-hover:text-primary">Frequently Asked Questions</h3>
              <p className="text-sm text-muted-foreground">Find answers to common questions</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all group"
    >
      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
      <div className="flex-1">
        <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
    </Link>
  );
}
