'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getMcpTools } from '@/lib/mcp/config-generator';

export function IntegrationGuide() {
  const tools = getMcpTools();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-3xl font-light text-black dark:text-white">
            MCP Integration Guide
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            The Model Context Protocol (MCP) enables AI assistants to directly read, search, and propose changes to your documentation.
            Once configured, your AI assistant will have access to all documents in this project.
          </p>
          <h3 className="text-xl font-normal text-black dark:text-white mb-3">How It Works</h3>
          <ol className="list-decimal list-inside space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>Generate an API key from the API Keys tab</li>
            <li>Copy the configuration for your IDE from the IDE Configs tab</li>
            <li>Add the configuration to your IDE settings</li>
            <li>Restart your IDE to apply changes</li>
            <li>Your AI assistant can now access your documentation</li>
          </ol>
        </CardContent>
      </Card>

      {/* Available Tools */}
      <Card>
        <CardHeader>
          <h2 className="text-3xl font-light text-black dark:text-white">
            Available MCP Tools
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Your AI assistant will have access to these {tools.length} tools for working with your documentation:
          </p>
          <div className="space-y-4">
            {tools.map((tool, index) => (
              <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                <h3 className="font-medium text-black dark:text-white mb-2">
                  {tool.name}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  {tool.description}
                </p>
                {tool.parameters && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-500 font-mono">
                    <div className="font-semibold mb-1">Parameters:</div>
                    {Object.entries(tool.parameters).map(([key, value]) => (
                      <div key={key} className="ml-4">
                        • {key}: {value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <h2 className="text-3xl font-light text-black dark:text-white">
            Security Best Practices
          </h2>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Store API keys securely and never commit them to version control</li>
            <li>• Use environment variables or secure configuration files</li>
            <li>• Create separate API keys for different environments (dev, staging, prod)</li>
            <li>• Regularly rotate API keys and deactivate unused ones</li>
            <li>• Monitor API key usage in the API Keys tab</li>
            <li>• Revoke compromised keys immediately</li>
          </ul>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <h2 className="text-3xl font-light text-black dark:text-white">
            Troubleshooting
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-black dark:text-white mb-2">
                Connection Failed
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                • Verify your API key is active in the API Keys tab<br />
                • Check that the configuration is correctly formatted<br />
                • Ensure you've restarted your IDE after making changes<br />
                • Confirm your firewall allows outbound connections to Docjays.com
              </p>
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white mb-2">
                Unauthorized Error
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                • Your API key may be deactivated or deleted - generate a new one<br />
                • Ensure the API key is correctly copied without extra spaces<br />
                • Check that the key belongs to the correct project
              </p>
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white mb-2">
                Tools Not Showing
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                • Some IDEs require a restart to load new MCP servers<br />
                • Check your IDE's MCP settings to confirm the server is enabled<br />
                • Review your IDE's console/logs for error messages
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
