import sanitizeHtml from 'sanitize-html';

// Shared sanitizer for rich post content that is injected via
// dangerouslySetInnerHTML (markdown, richtext, and LaTeX renderer output).
// `marked` (v18) does NOT sanitize, and the LaTeX renderer passes raw HTML
// blocks through verbatim, so every render boundary must run through this.
//
// NOTE: full-document "html"-format posts are NOT sanitized here — they are
// isolated in a sandboxed iframe (no allow-same-origin) instead, so author
// HTML/CSS/JS embeds keep working without access to this origin.

// MathML tags emitted by KaTeX (output: htmlAndMathml). Keeping them prevents
// the accessible MathML tree from being unwrapped into stray text beside the
// visual math.
const MATHML_TAGS = [
  'math', 'semantics', 'annotation', 'annotation-xml', 'mrow', 'mi', 'mo', 'mn',
  'ms', 'mtext', 'mspace', 'msup', 'msub', 'msubsup', 'mfrac', 'mroot', 'msqrt',
  'mstyle', 'mtable', 'mtr', 'mtd', 'mlabeledtr', 'munder', 'mover', 'munderover',
  'mpadded', 'mphantom', 'menclose', 'mfenced', 'mmultiscripts', 'mprescripts',
  'none', 'merror', 'maction',
];

const ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'figure', 'figcaption', 'picture', 'source',
  'span', 'div', 'section', 'article', 'header', 'footer', 'main', 'aside',
  'sup', 'sub', 'u', 's', 'del', 'ins', 'mark', 'small', 'abbr', 'kbd', 'samp',
  'var', 'wbr', 'hr', 'pre', 'code', 'blockquote',
  'details', 'summary', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  ...MATHML_TAGS,
];

export function sanitizeRichHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': [
        'class', 'style', 'id', 'title', 'dir', 'lang', 'align', 'role',
        'aria-hidden', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-level',
        'colspan', 'rowspan', 'width', 'height', 'data-*',
        // common MathML attributes
        'mathvariant', 'displaystyle', 'scriptlevel', 'stretchy', 'accent',
        'accentunder', 'encoding', 'definitionurl', 'xmlns', 'separators', 'open',
        'close', 'fence', 'linethickness', 'columnalign', 'rowalign', 'notation',
        'mathcolor', 'mathbackground',
      ],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
      source: ['src', 'srcset', 'type', 'media', 'sizes'],
      td: ['colspan', 'rowspan', 'align', 'valign'],
      th: ['colspan', 'rowspan', 'align', 'valign', 'scope'],
    },
    // Block javascript:/vbscript: and friends. Allow data: for images only.
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    transformTags: {
      // Harden any links the content opens.
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }, true),
    },
  });
}

export default sanitizeRichHtml;
