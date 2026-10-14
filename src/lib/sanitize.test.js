import { describe, it, expect } from 'vitest';
import { sanitizeRichHtml } from './sanitize.js';

describe('sanitizeRichHtml — XSS is stripped', () => {
  it('removes <script> tags', () => {
    const out = sanitizeRichHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain('hi');
  });

  it('removes inline event handlers (onerror)', () => {
    const out = sanitizeRichHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toContain('alert(1)');
  });

  it('drops javascript: URLs on links', () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it('drops javascript: in image src', () => {
    const out = sanitizeRichHtml('<img src="javascript:alert(1)">');
    expect(out).not.toMatch(/javascript:/i);
  });

  it('neutralizes the latex/richtext raw-passthrough vector', () => {
    // renderRichtextContent / renderLatex can emit verbatim HTML; sanitize is the backstop.
    const out = sanitizeRichHtml('<h1>a</h1><h2>b</h2><img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/onerror/i);
  });
});

describe('sanitizeRichHtml — legitimate content is preserved', () => {
  it('keeps headings and basic formatting', () => {
    const out = sanitizeRichHtml('<h2>Title</h2><p><strong>bold</strong> <em>x</em></p>');
    expect(out).toContain('<h2>');
    expect(out).toContain('<strong>');
  });

  it('keeps tables', () => {
    const out = sanitizeRichHtml('<table><tbody><tr><td>a</td></tr></tbody></table>');
    expect(out).toContain('<table>');
    expect(out).toContain('<td>');
  });

  it('keeps code blocks', () => {
    const out = sanitizeRichHtml('<pre><code>const x = 1;</code></pre>');
    expect(out).toContain('<pre>');
    expect(out).toContain('<code>');
  });

  it('preserves KaTeX spans with class and style', () => {
    const html = '<span class="katex"><span class="katex-html" style="margin:1px">x</span></span>';
    const out = sanitizeRichHtml(html);
    expect(out).toContain('class="katex"');
    expect(out).toContain('style="margin:1px"');
  });

  it('preserves MathML (KaTeX accessible output is not unwrapped)', () => {
    const html = '<span class="katex-mathml"><math><semantics><mrow><mi>x</mi></mrow></semantics></math></span>';
    const out = sanitizeRichHtml(html);
    expect(out).toContain('<math>');
    expect(out).toContain('<mi>');
  });

  it('keeps https links and hardens them with rel=noopener', () => {
    const out = sanitizeRichHtml('<a href="https://example.com" target="_blank">link</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toMatch(/rel="[^"]*noopener/);
  });

  it('allows data: URIs for images only', () => {
    const out = sanitizeRichHtml('<img src="data:image/png;base64,iVBORw0KGgo=">');
    expect(out).toContain('data:image/png');
  });
});

describe('sanitizeRichHtml — input guards', () => {
  it('returns empty string for falsy / non-string input', () => {
    expect(sanitizeRichHtml('')).toBe('');
    expect(sanitizeRichHtml(null)).toBe('');
    expect(sanitizeRichHtml(undefined)).toBe('');
    expect(sanitizeRichHtml(42)).toBe('');
  });
});
