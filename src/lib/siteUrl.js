// Public origin of this BlogWrite instance, without a trailing slash.
// Set NEXT_PUBLIC_APP_URL in production (it is inlined at build time, so the
// same value works in server and client code). Falls back to local dev.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

// The remote MCP endpoint AI assistants connect to.
export const MCP_URL = `${SITE_URL}/api/mcp`;
