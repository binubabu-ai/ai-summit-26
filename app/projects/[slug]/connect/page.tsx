'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { AppNav } from '@/components/layout/AppNav';
import { Zap, Key, Code, Book } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { ConnectQuickStart } from '@/components/connect/ConnectQuickStart';
import { ApiKeyManager } from '@/components/connect/ApiKeyManager';
import { IdeConfigTabs } from '@/components/connect/IdeConfigTabs';
import { IntegrationGuide } from '@/components/connect/IntegrationGuide';

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
  isActive: boolean;
}

type ConnectTab = 'quick-start' | 'api-keys' | 'ide-configs' | 'documentation';

export default function ConnectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState<ConnectTab>('quick-start');
  const [selectedIde, setSelectedIde] = useState('claude-desktop');
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch project and API keys on mount
  useEffect(() => {
    fetchProjectAndKeys();
  }, []);

  // Auto-select first API key
  useEffect(() => {
    if (apiKeys.length > 0 && !selectedApiKey) {
      setSelectedApiKey(apiKeys[0]);
    }
  }, [apiKeys, selectedApiKey]);

  const fetchProjectAndKeys = async () => {
    try {
      // Fetch project
      const projectRes = await fetch(`/api/projects/${resolvedParams.slug}`);
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData);

        // Fetch API keys
        const keysRes = await fetch(`/api/projects/${resolvedParams.slug}/api-keys`);
        if (keysRes.ok) {
          const keysData = await keysRes.json();
          setApiKeys(keysData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project and keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyCreated = (newKey: ApiKey) => {
    setSelectedApiKey(newKey);
    setActiveTab('ide-configs');
  };

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <PageLoader />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen pt-32 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="text-center">
            <h1 className="text-4xl font-light mb-4 text-black dark:text-white">Project Not Found</h1>
            <Link href="/dashboard">
              <button className="text-sm text-black dark:text-white underline">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <div className="min-h-screen pt-32 pb-16 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
          {/* Header */}
          <div className="mb-12">
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white text-sm mb-4"
            >
              ← Back to Project
            </Link>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-black dark:text-white mb-4">
              Connect
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Set up MCP integration for your AI assistants
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('quick-start')}
              className={`pb-4 px-2 text-lg font-light transition-colors relative whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'quick-start'
                  ? 'text-black dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Zap className="w-5 h-5" />
              Quick Start
              {activeTab === 'quick-start' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('api-keys')}
              className={`pb-4 px-2 text-lg font-light transition-colors relative whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'api-keys'
                  ? 'text-black dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Key className="w-5 h-5" />
              API Keys
              {activeTab === 'api-keys' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('ide-configs')}
              className={`pb-4 px-2 text-lg font-light transition-colors relative whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'ide-configs'
                  ? 'text-black dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Code className="w-5 h-5" />
              IDE Configs
              {activeTab === 'ide-configs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('documentation')}
              className={`pb-4 px-2 text-lg font-light transition-colors relative whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'documentation'
                  ? 'text-black dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Book className="w-5 h-5" />
              Documentation
              {activeTab === 'documentation' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'quick-start' && (
              <ConnectQuickStart
                apiKeys={apiKeys}
                onNavigateToKeys={() => setActiveTab('api-keys')}
              />
            )}

            {activeTab === 'api-keys' && (
              <ApiKeyManager
                projectSlug={resolvedParams.slug}
                onKeyCreated={handleKeyCreated}
              />
            )}

            {activeTab === 'ide-configs' && (
              <IdeConfigTabs
                selectedIde={selectedIde}
                onSelectIde={setSelectedIde}
                selectedApiKey={selectedApiKey}
                apiKeys={apiKeys}
                onSelectApiKey={setSelectedApiKey}
                projectSlug={resolvedParams.slug}
              />
            )}

            {activeTab === 'documentation' && <IntegrationGuide />}
          </div>
        </div>
      </div>
    </>
  );
}
