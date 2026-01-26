'use client';

import { Key, FileCode, Plug, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
  isActive: boolean;
}

interface ConnectQuickStartProps {
  apiKeys: ApiKey[];
  onNavigateToKeys: () => void;
}

export function ConnectQuickStart({ apiKeys, onNavigateToKeys }: ConnectQuickStartProps) {
  const hasKeys = apiKeys.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light mb-4 text-black dark:text-white">
          Connect Your AI Assistant
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Give Claude, Cursor, or Windsurf direct access to your documentation
        </p>
      </div>

      {/* 3-Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardContent className="text-center pt-6">
            <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-white dark:text-black" />
            </div>
            <h3 className="font-normal mb-2 text-black dark:text-white">1. Generate API Key</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Create a secure key for your IDE
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center pt-6">
            <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCode className="w-6 h-6 text-white dark:text-black" />
            </div>
            <h3 className="font-normal mb-2 text-black dark:text-white">2. Copy Configuration</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              One-click copy for your IDE
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center pt-6">
            <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Plug className="w-6 h-6 text-white dark:text-black" />
            </div>
            <h3 className="font-normal mb-2 text-black dark:text-white">3. Start Using</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              AI can read and propose changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      {hasKeys ? (
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <div className="text-sm font-medium text-black dark:text-white">
                    {apiKeys.length} API {apiKeys.length === 1 ? 'Key' : 'Keys'} Active
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Ready to connect to your IDE
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={onNavigateToKeys}>
                Manage Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center">
          <Button onClick={onNavigateToKeys} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Generate Your First API Key
          </Button>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-4">
            You'll need an API key to configure your IDE
          </p>
        </div>
      )}

      {/* What's Next */}
      {hasKeys && (
        <div className="mt-12">
          <h3 className="text-2xl font-light mb-4 text-black dark:text-white text-center">
            What's Next?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-2 text-black dark:text-white">Configure Your IDE</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Copy your configuration and add it to your IDE settings
                </p>
                <Button variant="ghost" size="sm" className="text-black dark:text-white">
                  Go to IDE Configs →
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-2 text-black dark:text-white">View Documentation</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Learn about available MCP tools and features
                </p>
                <Button variant="ghost" size="sm" className="text-black dark:text-white">
                  Read Docs →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
