import Link from 'next/link';
import { BookOpen, Code, Zap, MessageCircle, ArrowRight } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          AI Summit Documentation
        </h1>
        <p className="text-xl text-muted-foreground">
          Everything you need to know about managing documentation with AI-powered tools.
        </p>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HelpCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Getting Started"
          description="Learn the basics and create your first project in minutes"
          href="/help/getting-started"
        />
        <HelpCard
          icon={<Zap className="w-6 h-6" />}
          title="Feature Guides"
          description="Detailed guides for all features and workflows"
          href="/help/guides/projects"
        />
        <HelpCard
          icon={<Code className="w-6 h-6" />}
          title="API & Integration"
          description="REST API and MCP integration documentation"
          href="/help/api"
        />
        <HelpCard
          icon={<MessageCircle className="w-6 h-6" />}
          title="FAQ & Support"
          description="Frequently asked questions and troubleshooting"
          href="/help/faq"
        />
      </div>

      {/* Popular Topics */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Popular Topics</h2>
        <div className="space-y-3">
          <TopicLink
            href="/help/getting-started"
            title="How to create and manage projects"
          />
          <TopicLink
            href="/help/guides/documents"
            title="Document management and editing"
          />
          <TopicLink
            href="/help/api/mcp"
            title="Integrating with Claude Desktop via MCP"
          />
          <TopicLink
            href="/help/guides/revisions"
            title="Understanding version control and revisions"
          />
          <TopicLink
            href="/help/guides/ai-features"
            title="Using AI assistant features effectively"
          />
          <TopicLink
            href="/help/guides/audit"
            title="Running document audits and compliance checks"
          />
        </div>
      </section>

      {/* What's New */}
      <section className="border rounded-lg p-6 bg-accent/50">
        <h2 className="text-xl font-bold mb-3">What's New</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">●</span>
            <span>
              <strong>MCP Integration:</strong> Connect Claude Desktop to access your documentation directly
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">●</span>
            <span>
              <strong>AI-Powered Audits:</strong> Automatically check document quality and consistency
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">●</span>
            <span>
              <strong>Revision System:</strong> Propose, review, and approve changes with version control
            </span>
          </li>
        </ul>
      </section>

      {/* Need More Help */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Need More Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Can't find what you're looking for?</h3>
            <p className="text-muted-foreground mb-3">
              Check our FAQ or search through all documentation.
            </p>
            <Link
              href="/help/faq"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Visit FAQ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div>
            <h3 className="font-medium mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-3">
              Our support team is here to help.
            </p>
            <Link
              href="/help/support"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Contact Support <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HelpCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block p-6 border rounded-lg hover:shadow-lg hover:border-primary/50 transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </Link>
  );
}

function TopicLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-primary hover:underline group"
    >
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      <span>{title}</span>
    </Link>
  );
}
