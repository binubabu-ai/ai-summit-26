import Link from 'next/link';
import { BookOpen, Code, MessageCircle, Terminal, ArrowRight } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-6">
          Documentation
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light max-w-3xl">
          Everything you need to know about managing documentation with AI-powered tools.
        </p>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HelpCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Getting Started"
          description="Learn the basics and create your first project"
          href="/help/getting-started"
        />
        <HelpCard
          icon={<Terminal className="w-6 h-6" />}
          title="CLI Tool"
          description="Command-line tool for documentation management"
          href="/help/cli"
        />
        <HelpCard
          icon={<Code className="w-6 h-6" />}
          title="MCP Integration"
          description="Connect AI assistants to your documentation"
          href="/help/api/mcp"
        />
        <HelpCard
          icon={<MessageCircle className="w-6 h-6" />}
          title="FAQ"
          description="Frequently asked questions and troubleshooting"
          href="/help/faq"
        />
      </div>

      {/* What's New */}
      <section className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 bg-white dark:bg-black">
        <h2 className="text-2xl font-normal text-black dark:text-white mb-6">What's New</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="text-green-600 mt-1 flex-shrink-0">●</span>
            <div>
              <strong className="text-black dark:text-white">MCP Integration:</strong>
              <span className="text-neutral-600 dark:text-neutral-400"> Connect Claude Desktop to access your documentation directly</span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 mt-1 flex-shrink-0">●</span>
            <div>
              <strong className="text-black dark:text-white">AI-Powered Audits:</strong>
              <span className="text-neutral-600 dark:text-neutral-400"> Automatically check document quality and consistency</span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 mt-1 flex-shrink-0">●</span>
            <div>
              <strong className="text-black dark:text-white">Revision System:</strong>
              <span className="text-neutral-600 dark:text-neutral-400"> Propose, review, and approve changes with version control</span>
            </div>
          </li>
        </ul>
      </section>

      {/* Popular Topics */}
      <section>
        <h2 className="text-2xl font-normal text-black dark:text-white mb-6">Popular Topics</h2>
        <div className="space-y-3">
          <TopicLink
            href="/help/getting-started"
            title="How to create and manage projects"
          />
          <TopicLink
            href="/help/cli"
            title="Using the Docjays CLI tool"
          />
          <TopicLink
            href="/help/api/mcp"
            title="Integrating with AI assistants via MCP"
          />
          <TopicLink
            href="/help/faq"
            title="Frequently asked questions"
          />
        </div>
      </section>

      {/* Need More Help */}
      <section className="border-t border-neutral-200 dark:border-neutral-800 pt-12">
        <h2 className="text-2xl font-normal text-black dark:text-white mb-8">Need More Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium text-black dark:text-white mb-2">Can't find what you're looking for?</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Check our FAQ for answers to common questions.
            </p>
            <Link
              href="/help/faq"
              className="text-black dark:text-white hover:opacity-70 transition-opacity inline-flex items-center gap-2"
            >
              Visit FAQ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div>
            <h3 className="font-medium text-black dark:text-white mb-2">Still have questions?</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Reach out through our documentation or project settings.
            </p>
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
      className="group block p-6 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all bg-white dark:bg-black"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-black dark:text-white">
          {icon}
        </div>
        <h3 className="text-lg font-normal text-black dark:text-white">
          {title}
        </h3>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm">{description}</p>
    </Link>
  );
}

function TopicLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors group"
    >
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
      <span>{title}</span>
    </Link>
  );
}
