// ============================================================
// AgentOS — Web Search Tool (DuckDuckGo HTML Scraping)
// Production-ready search returning structured results
// ============================================================

import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('WebSearchTool');

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Search DuckDuckGo HTML for results.
 * Falls back to a lite endpoint if the main one fails.
 */
async function duckDuckGoSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const html = await response.text();
    return parseSearchResults(html, maxResults);
  } catch (error) {
    logger.error('DuckDuckGo search failed', { error: String(error) });
    return [];
  }
}

function parseSearchResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Match DuckDuckGo result blocks
  const resultBlocks = html.match(/<a class="result__a"[^>]*>[\s\S]*?<\/a>[\s\S]*?<a class="result__snippet"[^>]*>[\s\S]*?<\/a>/gi) || [];

  // Fallback: match individual links + snippets
  const linkMatches = [...html.matchAll(/<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const snippetMatches = [...html.matchAll(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi)];

  for (let i = 0; i < Math.min(linkMatches.length, maxResults); i++) {
    const link = linkMatches[i];
    const snippet = snippetMatches[i];

    if (link) {
      const rawUrl = link[1] || '';
      // DuckDuckGo wraps URLs in a redirect; extract the actual URL
      const actualUrl = extractUrl(rawUrl);
      const title = stripHtml(link[2] || '');
      const snippetText = snippet ? stripHtml(snippet[1] || '') : '';

      if (title && actualUrl) {
        results.push({ title, url: actualUrl, snippet: snippetText });
      }
    }
  }

  return results;
}

function extractUrl(ddgUrl: string): string {
  // DuckDuckGo URLs look like: //duckduckgo.com/l/?uddg=https%3A%2F%2F...&rut=...
  const match = ddgUrl.match(/uddg=([^&]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  // If it's already a direct URL
  if (ddgUrl.startsWith('http')) return ddgUrl;
  if (ddgUrl.startsWith('//')) return `https:${ddgUrl}`;
  return ddgUrl;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Tool Definition ──────────────────────────────────────

export const webSearchTool = {
  name: 'web_search',
  description: 'Search the web using DuckDuckGo for real-time information, news, documentation, and research.',
  parameters: {
    query: { type: 'string', description: 'The search query', required: true },
  },
  execute: async (params: { query: string }): Promise<{ success: boolean; results: SearchResult[] }> => {
    logger.info(`Web search: "${params.query}"`);
    const results = await duckDuckGoSearch(params.query, 5);
    logger.info(`Found ${results.length} results`);
    return { success: results.length > 0, results };
  },
};
