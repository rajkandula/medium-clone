import { getConfig } from './config.js';

/**
 * HTTP client for calling the BlogWrite API.
 * Automatically attaches the Bearer API key to every request.
 */
export class ApiClient {
  constructor() {
    const { apiKey, baseUrl } = getConfig();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Make a GET request to the BlogWrite API.
   */
  async get(path, params = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`API Error ${res.status}: ${error.error || res.statusText}`);
    }

    return res.json();
  }

  /**
   * Make a POST request to the BlogWrite API.
   */
  async post(path, body = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`API Error ${res.status}: ${error.error || res.statusText}`);
    }

    return res.json();
  }

  /**
   * Make a PUT request to the BlogWrite API.
   */
  async put(path, body = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`API Error ${res.status}: ${error.error || res.statusText}`);
    }

    return res.json();
  }

  /**
   * Make a DELETE request to the BlogWrite API.
   */
  async delete(path) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`API Error ${res.status}: ${error.error || res.statusText}`);
    }

    return res.json();
  }
}
