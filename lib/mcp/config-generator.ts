import configs from '@/public/mcp-configs.json';

/**
 * Generate IDE configuration with injected API key and project slug
 */
export function generateConfig(ideKey: string, apiKey: string, projectSlug: string): string {
  const ideConfig = (configs as any)[ideKey];
  if (!ideConfig) {
    throw new Error(`Unknown IDE: ${ideKey}`);
  }

  let configString = JSON.stringify(ideConfig.config, null, 2);

  // Replace placeholders
  configString = configString
    .replace(/your-api-key-here/g, apiKey)
    .replace(/your-project-slug/g, projectSlug)
    .replace(/\${Docjays_API_KEY}/g, apiKey);

  return configString;
}

/**
 * Generate environment configuration (for IDEs that use separate env files)
 */
export function generateEnvConfig(ideKey: string, apiKey: string): string | null {
  const ideConfig = (configs as any)[ideKey];
  if (!ideConfig || !ideConfig.envConfig) {
    return null;
  }

  let envString = JSON.stringify(ideConfig.envConfig, null, 2);

  // Replace placeholders
  envString = envString.replace(/your-api-key-here/g, apiKey);

  return envString;
}

/**
 * Generate CLI command for IDEs that support it
 */
export function generateCliCommand(ideKey: string, apiKey: string, projectSlug: string): string | null {
  const ideConfig = (configs as any)[ideKey];
  if (!ideConfig || !ideConfig.cliCommand) {
    return null;
  }

  let cliCommand = ideConfig.cliCommand;

  // Replace placeholders
  cliCommand = cliCommand
    .replace(/your-api-key-here/g, apiKey)
    .replace(/your-project-slug/g, projectSlug);

  return cliCommand;
}

/**
 * Get tools list from MCP configs
 */
export function getMcpTools(): Array<{
  name: string;
  description: string;
  parameters: Record<string, string>;
  example: Record<string, any>;
}> {
  return (configs as any).tools || [];
}
