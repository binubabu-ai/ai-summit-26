'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { HeroAnimation } from '@/components/landing/HeroAnimation';
import { StepAnimation } from '@/components/landing/StepAnimation';
import {
  Shield,
  Clock,
  GitBranch,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Failed to check auth:', error);
    } finally {
      setLoadingAuth(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-light tracking-tight text-black dark:text-white">
                Docjays
              </div>
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
                Beta
              </span>
            </div>

            <div className="flex items-center gap-6">
              <ThemeToggle />
              {loadingAuth ? (
                <div className="w-20 h-10 bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
              ) : user ? (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/auth/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 lg:px-16">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div>
              <h1 className="text-6xl md:text-8xl font-light tracking-tight text-black dark:text-white mb-8 leading-[1.1]">
                Documentation
                <br />
                that prevents
                <br />
                <span className="font-normal">hallucinations</span>
              </h1>

              <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl font-light leading-relaxed">
                The first documentation platform designed for AI agents. Detect conflicts,
                track freshness, and maintain confidence in every document.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="h-12 px-8">
                    Start Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-sm text-neutral-500 dark:text-neutral-600">
                  No credit card required
                </p>
              </div>
            </div>

            {/* Right: Animated SVG */}
            <div className="hidden lg:block">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 lg:px-16 border-t border-neutral-100 dark:border-neutral-900">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Feature 1 */}
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
                <Shield className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h3 className="text-2xl font-light text-black dark:text-white">
                Conflict Detection
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                AI-powered analysis catches contradictions and inconsistencies before
                they cause hallucinations in your AI systems.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
                <Clock className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h3 className="text-2xl font-light text-black dark:text-white">
                Freshness Tracking
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Know when knowledge is stale. Automatic scoring keeps your documentation
                trustworthy and up-to-date.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white dark:text-black" />
              </div>
              <h3 className="text-2xl font-light text-black dark:text-white">
                Version Control
              </h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Git-like branching and merging with visual diffs and approval workflows
                for documentation changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 lg:px-16 border-t border-neutral-100 dark:border-neutral-900">
        <div className="max-w-[1600px] mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-black dark:text-white mb-20 max-w-3xl">
            From documentation to intelligence in minutes
          </h2>

          <div className="space-y-32">
            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-normal text-white dark:text-black">01</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-light text-black dark:text-white">
                    Create & Organize
                  </h3>
                </div>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Start with a project, add documents, organize in folders. Use our
                  rich text editor or write in Markdown. Simple and intuitive.
                </p>
              </div>
              <div className="hidden lg:block h-96">
                <StepAnimation step={1} />
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="lg:order-2 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-normal text-white dark:text-black">02</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-light text-black dark:text-white">
                    AI Proposes Changes
                  </h3>
                </div>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Connect AI agents via MCP. Agents can read, search, and propose
                  improvements with clear rationale for each change.
                </p>
              </div>
              <div className="lg:order-1 hidden lg:block h-96">
                <StepAnimation step={2} />
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-normal text-white dark:text-black">03</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-light text-black dark:text-white">
                    Review & Govern
                  </h3>
                </div>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Approve with confidence. Risk scores, conflict detection, and
                  freshness tracking keep your knowledge base reliable.
                </p>
              </div>
              <div className="hidden lg:block h-96">
                <StepAnimation step={3} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-32 px-6 lg:px-16 border-t border-neutral-100 dark:border-neutral-900">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div>
              <h2 className="text-4xl md:text-5xl font-light text-black dark:text-white mb-8">
                Built for AI-powered teams
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Everything you need to keep AI agents and teams in sync with
                intelligent documentation governance.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-normal text-black dark:text-white mb-2">
                    Risk Scoring
                  </h4>
                  <p className="text-base text-neutral-600 dark:text-neutral-400">
                    Composite risk scores surface high-risk documents that need immediate attention
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-normal text-black dark:text-white mb-2">
                    AI Assistant
                  </h4>
                  <p className="text-base text-neutral-600 dark:text-neutral-400">
                    Ask questions, get explanations, and receive intelligent recommendations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-normal text-black dark:text-white mb-2">
                    MCP Integration
                  </h4>
                  <p className="text-base text-neutral-600 dark:text-neutral-400">
                    AI agents can safely read, search, and propose changes via Model Context Protocol
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 lg:px-16 border-t border-neutral-100 dark:border-neutral-900">
        <div className="max-w-[1600px] mx-auto">
          <div className="max-w-3xl">
            <h2 className="text-5xl md:text-6xl font-light text-black dark:text-white mb-8 leading-tight">
              Ready to prevent
              <br />
              hallucinations?
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-12 leading-relaxed">
              Join teams building reliable AI systems with governed documentation.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8">
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-16 border-t border-neutral-100 dark:border-neutral-900">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div>
              <h4 className="text-sm font-medium text-black dark:text-white mb-4 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/features" className="hover:text-black dark:hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-black dark:hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-black dark:hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-black dark:text-white mb-4 uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/docs" className="hover:text-black dark:hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-black dark:hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/guides" className="hover:text-black dark:hover:text-white transition-colors">Guides</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-black dark:text-white mb-4 uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-black dark:hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-black dark:hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-black dark:text-white mb-4 uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li><Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-100 dark:border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-neutral-500 dark:text-neutral-600">
              © 2026 Docjays. All rights reserved.
            </div>
            <div className="flex items-center gap-8">
              <Link href="https://twitter.com" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                Twitter
              </Link>
              <Link href="https://github.com" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                GitHub
              </Link>
              <Link href="https://discord.com" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
