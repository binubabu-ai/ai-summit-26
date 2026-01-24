# Docjays MCP Integration Guide

Connect your AI assistants (Claude Desktop, Cursor, Windsurf, Claude Code, VS Code) to your Docjays projects via Model Context Protocol (MCP).

## What is MCP?

Model Context Protocol allows AI assistants to directly access and propose changes to your documentation. Your AI can:
- Read any document in your project
- Search across all documentation
- Propose changes for review
- Get project insights

## Prerequisites

1. A Docjays project with documents
2. A project API key (see "Generating an API Key" below)
3. One of the supported AI assistants

## Generating an API Key

1. Navigate to your project in Docjays
2. Click on **Settings** → **API Keys**
3. Click **Generate New Key**
4. Give it a name (e.g., "Claude Desktop", "Cursor")
5. **Copy the key immediately** - you won't be able to see it again!
6. Store it securely (treat it like a password)

Your API key format: `dj_proj_xxxxxxxx_...`

## Configuration by IDE

### Claude Desktop

1. Locate your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the Docjays MCP server:

```json
{
  "mcpServers": {
    "Docjays": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://Docjays.com/api/mcp"
      ],
      "env": {
        "MCP_AUTH_TOKEN": "your-api-key-here"
      }
    }
  }
}
```

3. Replace `your-api-key-here` with your actual API key
4. Restart Claude Desktop
5. Look for the 🔌 icon to verify connection

**Alternative (Direct HTTP)**:

```json
{
  "mcpServers": {
    "Docjays": {
      "url": "https://Docjays.com/api/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key-here"
      }
    }
  }
}
```

### Cursor

1. Open Cursor settings (Cmd/Ctrl + ,)
2. Search for "MCP" or navigate to **Extensions → MCP Servers**
3. Add new server configuration:

```json
{
  "mcpServers": {
    "Docjays": {
      "url": "https://Docjays.com/api/mcp"
    }
  }
}
```

4. Add your API key to Cursor's environment variables:
   - Open `.cursor/config.json` in your workspace
   - Add:

```json
{
  "env": {
    "Docjays_API_KEY": "your-api-key-here"
  }
}
```

5. Update the server config to use the environment variable:

```json
{
  "mcpServers": {
    "Docjays": {
      "url": "https://Docjays.com/api/mcp",
      "headers": {
        "Authorization": "Bearer ${Docjays_API_KEY}"
      }
    }
  }
}
```

6. Reload Cursor window

**Quick Setup (Deeplink)**:

```
cursor://mcp/add?name=Docjays&url=https://Docjays.com/api/mcp
```

### Windsurf

1. Open Windsurf settings
2. Navigate to **MCP → Servers**
3. Click **Add Server**
4. Configure:

```json
{
  "name": "Docjays",
  "command": "npx",
  "args": ["mcp-remote", "https://Docjays.com/api/mcp"],
  "env": {
    "MCP_AUTH_TOKEN": "your-api-key-here"
  }
}
```

5. Save and restart Windsurf

### Claude Code (CLI)

1. Create or edit `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "Docjays": {
      "command": "npx",
      "args": ["mcp-remote", "https://Docjays.com/api/mcp"],
      "env": {
        "MCP_AUTH_TOKEN": "your-api-key-here"
      }
    }
  }
}
```

2. Or set via CLI:

```bash
claude-code mcp add Docjays \
  --command "npx" \
  --args "mcp-remote,https://Docjays.com/api/mcp" \
  --env "MCP_AUTH_TOKEN=your-api-key-here"
```

3. Verify connection:

```bash
claude-code mcp list
```

### VS Code (Continue Extension)

1. Install the **Continue** extension
2. Open Continue settings (Cmd/Ctrl + Shift + P → "Continue: Open Config")
3. Add to `config.json`:

```json
{
  "mcpServers": [
    {
      "name": "Docjays",
      "url": "https://Docjays.com/api/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key-here"
      }
    }
  ]
}
```

4. Reload VS Code window

## Available Tools

Once connected, your AI assistant can use these tools:

### `read_document`
Read the content of a specific document.

```typescript
{
  path: "architecture.md" | "api/auth.md"
}
```

### `search_documents`
Search across all documents by content or path.

```typescript
{
  query: "authentication",
  limit: 10 // optional
}
```

### `list_documents`
List all documents in the project with metadata.

### `propose_change`
Propose a change to a document (creates a proposal for review).

```typescript
{
  path: "api/auth.md",
  newContent: "# Updated content...",
  title: "Update authentication docs",
  rationale: "Adding OAuth 2.0 flow documentation"
}
```

### `get_project_info`
Get project metadata (doc count, open proposals, etc.).

## Example Usage

### With Claude Desktop:

**You**: "Read the architecture.md file from my project"

**Claude**: *Uses `read_document` tool*

---

**You**: "Search for all mentions of authentication"

**Claude**: *Uses `search_documents` tool*

---

**You**: "Update the API documentation to include the new OAuth flow"

**Claude**: *Uses `propose_change` to create a proposal*
"I've created a proposal for review. You can view it at [proposal URL]"

### With Cursor:

```typescript
// In your code, ask Cursor:
// "What does our architecture documentation say about database schema?"

// Cursor will use read_document to fetch architecture.md
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for keys in CI/CD
3. **Rotate keys regularly** (every 90 days recommended)
4. **Use separate keys** for each IDE/environment
5. **Deactivate unused keys** in project settings
6. **Monitor key usage** in the Docjays dashboard

## Troubleshooting

### Connection Failed

1. Verify your API key is correct
2. Check that the key hasn't expired
3. Ensure the key is active (check project settings)
4. Verify your internet connection
5. Check IDE console for detailed errors

### "Unauthorized" Error

- Your API key is invalid, expired, or inactive
- Solution: Generate a new key or reactivate existing one

### Tools Not Showing Up

1. Restart your IDE completely
2. Check config file syntax (valid JSON)
3. Verify the MCP server is running (🔌 icon in Claude Desktop)
4. Check IDE logs for connection errors

### "Document Not Found"

- Verify the document path is correct
- Path is case-sensitive
- Use forward slashes: `api/auth.md` not `api\auth.md`

## Rate Limits

- **100 requests per minute** per API key
- **1000 requests per hour** per project
- Exceeded limits return `429 Too Many Requests`

## Support

- **Documentation**: https://Docjays.com/docs
- **GitHub Issues**: https://github.com/Docjays/issues
- **Discord Community**: https://discord.gg/Docjays
- **Email Support**: support@Docjays.com

## Advanced Configuration

### Custom MCP Server (Self-Hosted)

If you're self-hosting Docjays:

```json
{
  "mcpServers": {
    "Docjays": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-domain.com/api/mcp"],
      "env": {
        "MCP_AUTH_TOKEN": "your-api-key-here"
      }
    }
  }
}
```

### Multiple Projects

To connect multiple projects, add separate entries:

```json
{
  "mcpServers": {
    "Docjays-ProjectA": {
      "command": "npx",
      "args": ["mcp-remote", "https://Docjays.com/api/mcp"],
      "env": {
        "MCP_AUTH_TOKEN": "key-for-project-a"
      }
    },
    "Docjays-ProjectB": {
      "command": "npx",
      "args": ["mcp-remote", "https://Docjays.com/api/mcp"],
      "env": {
        "MCP_AUTH_TOKEN": "key-for-project-b"
      }
    }
  }
}
```

### Environment Variables

For better security, use environment variables:

**macOS/Linux**:
```bash
export Docjays_API_KEY="your-key-here"
```

**Windows (PowerShell)**:
```powershell
$env:Docjays_API_KEY = "your-key-here"
```

Then reference in config:
```json
{
  "env": {
    "MCP_AUTH_TOKEN": "${Docjays_API_KEY}"
  }
}
```

## Changelog

### 2026-01-24
- Initial MCP integration launch
- Support for Claude Desktop, Cursor, Windsurf, Claude Code, VS Code
- 5 core tools: read, search, list, propose, get_info

---

**Ready to get started?** Generate your API key and connect your AI assistant in under 5 minutes! 🚀
