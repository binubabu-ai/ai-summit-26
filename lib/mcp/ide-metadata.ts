import { Sparkles, type LucideIcon, Code2, Wind, Terminal, Boxes } from 'lucide-react';

export interface IdeMetadata {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  platforms: ('macos' | 'windows' | 'linux')[];
  configPath: {
    macos?: string;
    windows?: string;
    linux?: string;
  };
  deeplink?: string;
  hasEnvConfig: boolean;
  hasCliCommand?: boolean;
}

export const IDE_METADATA: Record<string, IdeMetadata> = {
  'claude-desktop': {
    key: 'claude-desktop',
    name: 'Claude Desktop',
    description: 'Official Claude desktop application with MCP support',
    icon: Sparkles,
    platforms: ['macos', 'windows'],
    configPath: {
      macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
    },
    hasEnvConfig: false,
    hasCliCommand: false,
  },
  'cursor': {
    key: 'cursor',
    name: 'Cursor',
    description: 'AI-first code editor with MCP server integration',
    icon: Code2,
    platforms: ['macos', 'windows', 'linux'],
    configPath: {
      macos: 'Settings > MCP Servers',
      windows: 'Settings > MCP Servers',
      linux: 'Settings > MCP Servers',
    },
    deeplink: 'cursor://mcp/add?name=Docjays&url=https://Docjays.com/api/mcp',
    hasEnvConfig: true,
    hasCliCommand: false,
  },
  'windsurf': {
    key: 'windsurf',
    name: 'Windsurf',
    description: 'Collaborative IDE with MCP integration',
    icon: Wind,
    platforms: ['macos', 'windows', 'linux'],
    configPath: {
      macos: 'MCP → Servers → Add Server',
      windows: 'MCP → Servers → Add Server',
      linux: 'MCP → Servers → Add Server',
    },
    hasEnvConfig: false,
    hasCliCommand: false,
  },
  'claude-code': {
    key: 'claude-code',
    name: 'Claude Code',
    description: 'Claude CLI tool for terminal-based AI assistance',
    icon: Terminal,
    platforms: ['macos', 'windows', 'linux'],
    configPath: {
      macos: '~/.config/claude-code/mcp.json',
      windows: '%USERPROFILE%\\.config\\claude-code\\mcp.json',
      linux: '~/.config/claude-code/mcp.json',
    },
    hasEnvConfig: false,
    hasCliCommand: true,
  },
  'vscode-continue': {
    key: 'vscode-continue',
    name: 'VS Code (Continue)',
    description: 'Continue extension for Visual Studio Code',
    icon: Boxes,
    platforms: ['macos', 'windows', 'linux'],
    configPath: {
      macos: 'VS Code Settings > Extensions > Continue > config.json',
      windows: 'VS Code Settings > Extensions > Continue > config.json',
      linux: 'VS Code Settings > Extensions > Continue > config.json',
    },
    hasEnvConfig: false,
    hasCliCommand: false,
  },
};

// Helper to get platform-specific path
export function getPlatformPath(configPath: IdeMetadata['configPath']): string {
  const platform = typeof window !== 'undefined' && navigator.platform.toLowerCase();

  if (platform && platform.includes('mac')) {
    return configPath.macos || configPath.linux || configPath.windows || 'N/A';
  } else if (platform && platform.includes('win')) {
    return configPath.windows || configPath.linux || configPath.macos || 'N/A';
  } else {
    return configPath.linux || configPath.macos || configPath.windows || 'N/A';
  }
}

// Get IDE list in order
export const IDE_LIST = Object.keys(IDE_METADATA);
