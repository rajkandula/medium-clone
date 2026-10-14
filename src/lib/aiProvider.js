import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * Free, open-source text generation — no paid APIs, no API keys.
 *
 * Default: local Ollama (https://ollama.com) via its OpenAI-compatible API.
 *   OLLAMA_BASE_URL  default http://localhost:11434/v1
 *   OLLAMA_MODEL     default gpt-oss:20b (open-source; `ollama pull gpt-oss:20b`)
 *                    other good options: gemma3:12b, llama3.1
 *
 * Optional override — point at ANY other OpenAI-compatible endpoint:
 *   AI_BASE_URL      e.g. http://localhost:1234/v1 (LM Studio),
 *                    https://api.groq.com/openai/v1 (free tier, needs key)
 *   AI_API_KEY       key for that endpoint (omit if not needed)
 *   AI_MODEL         model id for that endpoint
 */

function buildModel() {
  if (process.env.AI_BASE_URL) {
    const provider = createOpenAICompatible({
      name: 'custom',
      baseURL: process.env.AI_BASE_URL,
      ...(process.env.AI_API_KEY ? { apiKey: process.env.AI_API_KEY } : {}),
    });
    return provider(process.env.AI_MODEL || 'gpt-oss:20b');
  }

  const ollama = createOpenAICompatible({
    name: 'ollama',
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  });
  return ollama(process.env.OLLAMA_MODEL || 'gpt-oss:20b');
}

export const textModel = buildModel();
