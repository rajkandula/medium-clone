import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['author', 'summary', 'id', 'category'],
  },
});

const ARXIV_QUERIES = [
  'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL',
  'cat:cs.SE+OR+cat:cs.CR+OR+cat:cs.HC',
  'cat:astro-ph.EP+OR+cat:astro-ph.CO+OR+cat:physics.pop-ph+OR+cat:physics.ed-ph',
  'cat:q-bio.NC+OR+cat:q-bio.PE+OR+cat:physics.bio-ph',
  'cat:econ.GN+OR+cat:q-fin.GN+OR+cat:stat.AP+OR+cat:math.HO',
  'cat:eess.SY+OR+cat:eess.IV'
];

function getTopicsFromArxivCategory(categoryTerm) {
  if (!categoryTerm) return ['General Science'];
  const term = categoryTerm.toLowerCase();
  
  if (term.startsWith('cs.ai') || term.startsWith('cs.lg') || term.startsWith('cs.cl') || term.startsWith('cs.cv') || term.startsWith('cs.ne')) {
    return ['AI', 'Computer Science'];
  }
  if (term.startsWith('cs.cr')) {
    return ['Security', 'Computer Science'];
  }
  if (term.startsWith('cs.hc')) {
    return ['Human-Computer Interaction'];
  }
  if (term.startsWith('cs.')) {
    return ['Computer Science'];
  }
  if (term.startsWith('eess.')) {
    return ['Engineering'];
  }
  if (term.startsWith('astro-ph')) {
    return ['Astronomy', 'Space'];
  }
  if (term === 'physics.ed-ph' || term === 'math.ho') {
    return ['Education'];
  }
  if (term.startsWith('physics.')) {
    return ['Physics'];
  }
  if (term.startsWith('math.')) {
    return ['Mathematics'];
  }
  if (term.startsWith('q-bio.')) {
    return ['Biology'];
  }
  if (term.startsWith('q-fin.')) {
    return ['Finance'];
  }
  if (term.startsWith('stat.')) {
    return ['Statistics'];
  }
  if (term.startsWith('econ.')) {
    return ['Economics'];
  }
  return ['General Science'];
}

/**
 * Fetch latest papers from arXiv
 * @returns {Promise<Array>} Array of parsed paper objects
 */
export async function fetchArxivPapers() {
  const allParsedPapers = [];
  const seenUrls = new Set();
  
  for (const query of ARXIV_QUERIES) {
    const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=15`;
    
    try {
      console.log(`[ResearchFetcher] Fetching: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlogWrite/1.0',
        },
      });

      if (!response.ok) {
        console.warn(`[ResearchFetcher] Failed to fetch query "${query}": ${response.status}`);
        continue;
      }

      const xmlData = await response.text();
      const feed = await parser.parseString(xmlData);

      for (const item of feed.items) {
        const sourceUrl = item.id || item.link;
        if (seenUrls.has(sourceUrl)) continue;
        seenUrls.add(sourceUrl);

        allParsedPapers.push({
          title: item.title?.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() || '',
          abstract: item.summary?.trim() || '',
          authors: item.author ? [item.author] : [], // arXiv atom feed author is usually single string or array, rss-parser simplifies it.
          publishedAt: new Date(item.pubDate || item.isoDate),
          sourceUrl,
          sourceName: 'arXiv',
          topics: getTopicsFromArxivCategory(item.category?.$.term || item.category || ''),
        });
      }
      
      // Delay 3 seconds between requests to respect arXiv guidelines
      await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      console.error(`[ResearchFetcher] Error fetching query "${query}":`, error);
    }
  }

  return allParsedPapers;
}

