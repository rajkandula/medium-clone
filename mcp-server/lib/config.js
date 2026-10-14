/**
 * Configuration for the BlogWrite MCP server.
 * Reads API key and base URL from environment variables.
 */

export function getConfig() {
  const apiKey = process.env.BLOGWRITE_API_KEY;
  const baseUrl = process.env.BLOGWRITE_URL || 'http://localhost:3000';

  if (!apiKey) {
    console.error('❌ BLOGWRITE_API_KEY environment variable is required.');
    console.error('   Generate one at: {your-blogwrite-url}/dashboard/api-keys');
    process.exit(1);
  }

  return { apiKey, baseUrl };
}
