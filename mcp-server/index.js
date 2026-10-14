#!/usr/bin/env node

/**
 * BlogWrite MCP Server
 * 
 * Connects BlogWrite to Claude Desktop via the Model Context Protocol.
 * Gives Claude full access to all BlogWrite features: posts, AI writing,
 * feed, Pulse news, research papers, bookmarks, comments, search, and profile.
 * 
 * Usage:
 *   BLOGWRITE_API_KEY=bw_xxx BLOGWRITE_URL=https://yoursite.com node index.js
 * 
 * Claude Desktop config (~/Library/Application Support/Claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "blogwrite": {
 *         "command": "node",
 *         "args": ["/path/to/mcp-server/index.js"],
 *         "env": {
 *           "BLOGWRITE_API_KEY": "bw_your_api_key_here",
 *           "BLOGWRITE_URL": "https://yoursite.com"
 *         }
 *       }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ApiClient } from './lib/api-client.js';

// Import tool modules
import { registerPostTools } from './tools/posts.js';
import { registerAiTools } from './tools/ai.js';
import { registerFeedTools } from './tools/feed.js';
import { registerPulseTools } from './tools/pulse.js';
import { registerResearchTools } from './tools/research.js';
import { registerBookmarkTools } from './tools/bookmarks.js';
import { registerCommentTools } from './tools/comments.js';
import { registerProfileTools } from './tools/profile.js';
import { registerSearchTools } from './tools/search.js';

// Create the MCP server
const server = new McpServer({
  name: 'blogwrite',
  version: '1.0.0',
  description: 'BlogWrite — Manage your blog, write with AI, browse Pulse news, read research papers, and more. All from Claude.',
});

// Create the API client
const api = new ApiClient();

// Register all tool modules
registerPostTools(server, api);
registerAiTools(server, api);
registerFeedTools(server, api);
registerPulseTools(server, api);
registerResearchTools(server, api);
registerBookmarkTools(server, api);
registerCommentTools(server, api);
registerProfileTools(server, api);
registerSearchTools(server, api);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
