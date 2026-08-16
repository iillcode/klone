import { MCP_URL } from "./constants";

export type ToolCategory = "Chat" | "IDE" | "Terminal" | "Automation";

/** One per-tool connection guide rendered in the "Connect a tool" tabs. */
export interface ToolGuide {
  id: string;
  name: string;
  /** Monogram shown in the tab button. */
  monogram: string;
  /** One-line description shown in the tab list. */
  tagline: string;
  category: ToolCategory;
  /** Ordered instructions, short imperative sentences. */
  steps: string[];
  /** Caption shown above the snippet. */
  configLabel?: string;
  /** Copyable config snippet (rendered when present). */
  configSnippet?: string;
  /** Free-form notes rendered under the snippet. */
  notes?: string[];
}

/**
 * Claude Desktop only speaks stdio natively, so remote HTTP servers are
 * bridged with `mcp-remote` — the pattern documented by Anthropic.
 */
const CLAUDE_DESKTOP_SNIPPET = `{
  "mcpServers": {
    "klone": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${MCP_URL}",
        "--header",
        "Authorization: Bearer <KLONE_ACCESS_TOKEN>"
      ]
    }
  }
}`;

const CLAUDE_CODE_SNIPPET = `claude mcp add --transport http klone \\
  "${MCP_URL}" \\
  --header "Authorization: Bearer <KLONE_ACCESS_TOKEN>"

# verify it is connected
claude mcp list`;

const VSCODE_SNIPPET = `{
  "servers": {
    "klone": {
      "type": "http",
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer <KLONE_ACCESS_TOKEN>"
      }
    }
  }
}`;

const CURSOR_SNIPPET = `{
  "mcpServers": {
    "klone": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer <KLONE_ACCESS_TOKEN>"
      }
    }
  }
}`;

const WINDSURF_SNIPPET = `{
  "mcpServers": {
    "klone": {
      "serverUrl": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer <KLONE_ACCESS_TOKEN>"
      }
    }
  }
}`;

const OPENCODE_SNIPPET = `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "klone": {
      "type": "remote",
      "url": "${MCP_URL}",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <KLONE_ACCESS_TOKEN>"
      }
    }
  }
}`;

const CLINE_SNIPPET = `{
  "mcpServers": {
    "klone": {
      "transportType": "streamableHttp",
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer <KLONE_ACCESS_TOKEN>"
      }
    }
  }
}`;

export const TOOL_GUIDES: ToolGuide[] = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    monogram: "Cd",
    tagline: "Anthropic's desktop app",
    category: "Chat",
    steps: [
      "Open the Claude Desktop config file.",
      "Add the Klone server entry below.",
      "Fully restart Claude Desktop, then check Settings → Developer. Claude will discover the 7 Klone tools.",
    ],
    configLabel: "claude_desktop_config.json",
    configSnippet: CLAUDE_DESKTOP_SNIPPET,
    notes: [
      "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json — Windows: %APPDATA%\\Claude\\claude_desktop_config.json",
      "Requires Node.js installed (npx bridges the hosted server over HTTP).",
    ],
  },
  {
    id: "claude-code",
    name: "Claude Code",
    monogram: "Cc",
    tagline: "Anthropic's terminal agent",
    category: "Terminal",
    steps: [
      "Run the add command from any project directory.",
      "Restart your Claude Code session.",
      "Ask it to build a document — it can now call Klone tools directly.",
    ],
    configLabel: "terminal",
    configSnippet: CLAUDE_CODE_SNIPPET,
    notes: [
      "Claude Code speaks HTTP MCP natively, so no bridge is needed.",
    ],
  },
  {
    id: "vscode",
    name: "VS Code",
    monogram: "VS",
    tagline: "GitHub Copilot agent mode",
    category: "IDE",
    steps: [
      "Open your workspace folder in VS Code.",
      "Create .vscode/mcp.json with the config below (or paste it under \"mcp.servers\" in your user settings.json).",
      "Run \"MCP: Start Server\" from the command palette, then use agent mode in Copilot Chat.",
    ],
    configLabel: ".vscode/mcp.json",
    configSnippet: VSCODE_SNIPPET,
    notes: [
      "Requires Microsoft 365 Copilot, or the free GitHub Copilot plan with agent mode enabled.",
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    monogram: "Cu",
    tagline: "AI-first IDE",
    category: "IDE",
    steps: [
      "Add a project .cursor/mcp.json in your repo, or open Cursor → Settings → Cursor Settings → MCP.",
      "Paste the Klone server config.",
      "Confirm the 7 Klone tools appear as enabled, then start building in agent mode.",
    ],
    configLabel: ".cursor/mcp.json",
    configSnippet: CURSOR_SNIPPET,
    notes: [
      "Project scope is best for teams — the file travels with the repo.",
    ],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    monogram: "Wf",
    tagline: "Codeium's agentic IDE",
    category: "IDE",
    steps: [
      "Open ~/.codeium/windsurf/mcp_config.json, or add it from Windsurf → Settings → AI → MCP tools.",
      "Add the server entry and hit Refresh.",
      "Cascade will list the Klone tools and can call them in any flow.",
    ],
    configLabel: "~/.codeium/windsurf/mcp_config.json",
    configSnippet: WINDSURF_SNIPPET,
    notes: [
      "Windsurf reads remote HTTP servers with auth headers natively.",
    ],
  },
  {
    id: "opencode",
    name: "OpenCode",
    monogram: "Oc",
    tagline: "Open-source terminal agent",
    category: "Terminal",
    steps: [
      "Create opencode.json at your project root (or ~/.config/opencode/opencode.json globally).",
      "Add the mcp entry below.",
      "Restart OpenCode — the klone server shows up under /mcp.",
    ],
    configLabel: "opencode.json",
    configSnippet: OPENCODE_SNIPPET,
    notes: [
      "OpenCode auto-reconnects remote servers; restart it after rotating your token.",
    ],
  },
  {
    id: "cline",
    name: "Cline",
    monogram: "Cl",
    tagline: "Open-source VS Code agent",
    category: "IDE",
    steps: [
      "Open the Cline extension → MCP servers tab.",
      "Edit cline_mcp_settings.json and add the entry below.",
      "Toggle the server on and start a task — Cline will request permission before each tool call.",
    ],
    configLabel: "cline_mcp_settings.json",
    configSnippet: CLINE_SNIPPET,
    notes: [
      "Use Cline's allowed-tools list to auto-approve read-only Klone calls like list_pdf_templates.",
    ],
  },
  {
    id: "n8n",
    name: "n8n",
    monogram: "n8",
    tagline: "Workflow automation",
    category: "Automation",
    steps: [
      "Add an MCP Client node to your workflow and open its settings.",
      "Set Transport Type → Streamable HTTP.",
      "Set Server Url → the Klone endpoint.",
      "Set Auth Type → Header Auth, Name → Authorization, Value → Bearer <KLONE_ACCESS_TOKEN>.",
      "Use a downstream AI Agent node (or call tools directly) — e.g. webhook in → create_document out.",
    ],
    notes: [
      "Store the token in an n8n credential and reference it instead of pasting it in the node.",
      "Great fit: trigger on a form or webhook, let the agent compose the HTML, save via create_document, then export the PDF.",
    ],
  },
  {
    id: "custom",
    name: "Any MCP client",
    monogram: "◈",
    tagline: "JSON-RPC over HTTP",
    category: "Automation",
    steps: [
      "POST a JSON-RPC request to the Klone endpoint.",
      "Send initialize first, then tools/list and tools/call.",
      "Send the Authorization header on every request.",
    ],
    configLabel: "curl — initialize then call get_pdf_template",
    configSnippet: `curl -s -X POST "${MCP_URL}" \\
  -H "Authorization: Bearer <KLONE_ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{
    "jsonrpc": "2.0", "id": 1, "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "your-app", "version": "1.0.0" }
    }
  }'`,
    notes: [
      "The server answers plain JSON (no SSE), which keeps simple clients working.",
      "Any tool that speaks Streamable HTTP MCP and custom headers can connect the same way.",
    ],
  },
];
