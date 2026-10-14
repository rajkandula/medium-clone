import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];

  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count}${label} ago`;
  }
  
  return 'just now';
}

export function estimateReadTime(content) {
  if (!content) return 1;
  // Strip HTML tags
  let text = content.replace(/<[^>]*>/g, '');
  // Strip LaTeX commands (\command{...}, \command[...]{...}, \command)
  text = text.replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, ' ');
  // Strip remaining LaTeX braces/brackets
  text = text.replace(/[{}\[\]]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

export function createSlug(text) {
  if (!text) return 'untitled';
  let cleaned = text;
  // Strip LaTeX commands like \documentclass, \usepackage, \begin, etc.
  cleaned = cleaned.replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, ' ');
  // Strip remaining braces, brackets, LaTeX special chars
  cleaned = cleaned.replace(/[{}\[\]\\$^_&~#%]/g, ' ');
  return cleaned
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'untitled';
}

export function truncate(str, length = 150) {
  if (!str || str.length <= length) return str;
  return str.substring(0, length).trim() + '...';
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
}

/**
 * Generates a clean, readable excerpt from any post format (LaTeX, Markdown, HTML, richtext).
 * Strips all markup and returns plain text suitable for feed previews.
 */
export function getPostExcerpt(post, maxLength = 160) {
  // Use the stored excerpt only if it's clean (no LaTeX commands, no CSS bleed)
  if (post.excerpt &&
      !/\\[a-zA-Z]/.test(post.excerpt) &&
      !/:root|box-sizing|<style|--[a-z]/.test(post.excerpt)) {
    return truncate(post.excerpt, maxLength);
  }

  const raw = post.content || '';

  let text = raw;

  // 1. Strip entire <style>, <script>, <head>, <noscript> blocks first
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<head[\s\S]*?<\/head>/gi, ' ');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  // 2. Strip LaTeX preamble block (\documentclass ... \begin{document})
  text = text.replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, '');
  // 3. Strip remaining \begin{...}...\end{...} environments
  text = text.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, '');
  // 4. Strip display math $$ ... $$
  text = text.replace(/\$\$[\s\S]*?\$\$/g, '');
  // 5. Strip inline math $ ... $
  text = text.replace(/\$[^$]+\$/g, '');
  // 6. Strip LaTeX commands with arguments → keep inner text
  text = text.replace(/\\(?:textbf|textit|emph|underline|text|mathrm|mathbf|section\*?|subsection\*?|subsubsection\*?|title|author|paragraph|footnote|caption|label|ref|cite)\{([^}]*)\}/g, '$1');
  // 7. Strip all remaining LaTeX commands
  text = text.replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, ' ');
  // 8. Strip leftover braces/brackets
  text = text.replace(/[{}[\]]/g, ' ');
  // 9. Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // 10. Strip CSS remnants (--variables, property:value, :selector{} blocks)
  text = text.replace(/--[a-zA-Z-]+\s*:[^;]+;/g, ' ');
  text = text.replace(/[a-z-]+\s*:\s*[^;{]+;/g, ' ');
  text = text.replace(/:[:\w-]+\s*\{[^}]*\}/g, ' ');
  // 11. Strip Markdown headings
  text = text.replace(/^#{1,6}\s+/gm, '');
  // 12. Strip Markdown bold/italic
  text = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/__(.+?)__/g, '$1');
  // 13. Strip Markdown code blocks and inline code
  text = text.replace(/```[\s\S]*?```/g, '').replace(/`([^`]+)`/g, '$1');
  // 14. Strip Markdown links and images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[(.+?)\]\(.*?\)/g, '$1');
  // 15. Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return truncate(text, maxLength) || 'Read more...';
}
