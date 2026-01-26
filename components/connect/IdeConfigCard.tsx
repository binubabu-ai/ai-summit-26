'use client';

import { useState } from 'react';
import { Copy, Key, ExternalLink, Info, Check, Terminal } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { IDE_METADATA, getPlatformPath } from '@/lib/mcp/ide-metadata';
import { generateConfig, generateEnvConfig, generateCliCommand } from '@/lib/mcp/config-generator';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
  isActive: boolean;
}

interface IdeConfigCardProps {
  ideKey: string;
  selectedApiKey: ApiKey | null;
  projectSlug: string;
}

export function IdeConfigCard({ ideKey, selectedApiKey, projectSlug }: IdeConfigCardProps) {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const ide = IDE_METADATA[ideKey];

  if (!ide) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            IDE configuration not found
          </p>
        </CardContent>
      </Card>
    );
  }

  const config = selectedApiKey
    ? generateConfig(ideKey, selectedApiKey.keyPrefix, projectSlug)
    : '';

  const envConfig = selectedApiKey && ide.hasEnvConfig
    ? generateEnvConfig(ideKey, selectedApiKey.keyPrefix)
    : null;

  const cliCommand = selectedApiKey && ide.hasCliCommand
    ? generateCliCommand(ideKey, selectedApiKey.keyPrefix, projectSlug)
    : null;

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(config);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch (error) {
      console.error('Failed to copy config:', error);
    }
  };

  const handleCopyKey = async () => {
    if (!selectedApiKey) return;
    try {
      await navigator.clipboard.writeText(selectedApiKey.keyPrefix);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (error) {
      console.error('Failed to copy key:', error);
    }
  };

  const handleCopyCli = async () => {
    if (!cliCommand) return;
    try {
      await navigator.clipboard.writeText(cliCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    } catch (error) {
      console.error('Failed to copy CLI command:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ide.icon className="w-6 h-6 text-black dark:text-white" />
            <div>
              <h3 className="text-xl font-normal text-black dark:text-white">{ide.name}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {ide.description}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedApiKey ? (
          <div className="space-y-6">
            {/* Configuration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-black dark:text-white">
                  Configuration
                </label>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  JSON format
                </span>
              </div>
              <CodeBlock code={config} language="json" />
            </div>

            {/* Environment Config (if applicable) */}
            {envConfig && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-black dark:text-white">
                    Environment Configuration
                  </label>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Separate env file
                  </span>
                </div>
                <CodeBlock code={envConfig} language="json" />
              </div>
            )}

            {/* CLI Command (if applicable) */}
            {cliCommand && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-black dark:text-white">
                    CLI Command
                  </label>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Terminal command
                  </span>
                </div>
                <CodeBlock code={cliCommand} language="bash" />
                <Button
                  onClick={handleCopyCli}
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                >
                  {copiedCli ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Terminal className="w-4 h-4 mr-2" />
                      Copy Command
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopyConfig}>
                {copiedConfig ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Configuration
                  </>
                )}
              </Button>

              <Button variant="secondary" onClick={handleCopyKey}>
                {copiedKey ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Copy API Key Only
                  </>
                )}
              </Button>

              {ide.deeplink && (
                <Button
                  variant="ghost"
                  onClick={() => window.open(ide.deeplink, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Quick Setup
                </Button>
              )}
            </div>

            {/* File Location Info */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-black dark:text-white mb-1">
                    File Location
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                    {getPlatformPath(ide.configPath)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Key className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
            <p className="text-neutral-600 dark:text-neutral-400 mb-2">
              No API key selected
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Select an API key to view the configuration
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
