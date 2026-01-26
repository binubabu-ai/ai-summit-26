'use client';

import { IDE_METADATA, IDE_LIST } from '@/lib/mcp/ide-metadata';
import { IdeConfigCard } from './IdeConfigCard';
import { Key } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
  isActive: boolean;
}

interface IdeConfigTabsProps {
  selectedIde: string;
  onSelectIde: (ideKey: string) => void;
  selectedApiKey: ApiKey | null;
  apiKeys: ApiKey[];
  onSelectApiKey: (key: ApiKey) => void;
  projectSlug: string;
}

export function IdeConfigTabs({
  selectedIde,
  onSelectIde,
  selectedApiKey,
  apiKeys,
  onSelectApiKey,
  projectSlug,
}: IdeConfigTabsProps) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* API Key Selector */}
      {apiKeys.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-light text-black dark:text-white mb-2">
            Select API Key
          </label>
          <select
            value={selectedApiKey?.id || ''}
            onChange={(e) => {
              const key = apiKeys.find((k) => k.id === e.target.value);
              if (key) onSelectApiKey(key);
            }}
            className="w-full md:w-auto px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-950 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          >
            {apiKeys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.name} ({key.keyPrefix})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* IDE Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        {IDE_LIST.map((ideKey) => {
          const ide = IDE_METADATA[ideKey];
          const isActive = selectedIde === ideKey;

          return (
            <button
              key={ideKey}
              onClick={() => onSelectIde(ideKey)}
              className={`pb-3 px-4 text-sm font-light whitespace-nowrap transition-colors relative flex items-center gap-2 ${
                isActive
                  ? 'text-black dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <ide.icon className="w-4 h-4" />
              {ide.name}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* IDE Config Card */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <Key className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
          <h3 className="text-xl font-light text-black dark:text-white mb-2">
            No API Keys Yet
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            You need an API key to configure your IDE
          </p>
        </div>
      ) : (
        <IdeConfigCard
          ideKey={selectedIde}
          selectedApiKey={selectedApiKey}
          projectSlug={projectSlug}
        />
      )}
    </div>
  );
}
