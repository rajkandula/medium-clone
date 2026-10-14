import katex from 'katex';

// ─── Brace-depth aware extraction ────────────────────────────────────────────
// Find content of a brace group starting at pos (pos should point to opening '{')
function extractBraceGroup(str, pos) {
  if (pos >= str.length || str[pos] !== '{') return null;
  let depth = 0, i = pos;
  while (i < str.length) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') { depth--; if (depth === 0) return { content: str.substring(pos + 1, i), end: i + 1 }; }
    i++;
  }
  return null;
}

// Extract N brace-delimited arguments starting at pos
function extractArgs(str, pos, n) {
  const args = [];
  let i = pos;
  for (let a = 0; a < n; a++) {
    while (i < str.length && str[i] !== '{') i++;
    if (i >= str.length) return null;
    const g = extractBraceGroup(str, i);
    if (!g) return null;
    args.push(g.content);
    i = g.end;
  }
  return { args, end: i };
}

// Parse \newcommand definitions with proper brace depth handling
function parseNewCommands(code) {
  const cmds = {};
  const re = /\\newcommand\{\\(\w+)\}(?:\[(\d+)\])?/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const name = m[1];
    const argCount = m[2] ? parseInt(m[2]) : 0;
    // Find the template body (brace group after the match)
    let i = m.index + m[0].length;
    // Skip optional % and whitespace
    while (i < code.length && (code[i] === '%' || code[i] === ' ' || code[i] === '\n' || code[i] === '\r' || code[i] === '\t')) {
      if (code[i] === '%') { while (i < code.length && code[i] !== '\n') i++; }
      i++;
    }
    if (i < code.length && code[i] === '{') {
      const g = extractBraceGroup(code, i);
      if (g) cmds[name] = { args: argCount, template: g.content };
    }
  }
  return cmds;
}

// Expand custom commands in text
function expandCustomCommands(text, cmds) {
  let result = text;
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const [name, def] of Object.entries(cmds)) {
      let idx = 0;
      while (true) {
        const pos = result.indexOf('\\' + name, idx);
        if (pos === -1) break;
        const afterCmd = pos + name.length + 1;
        // Make sure it's a complete command (not part of a longer word)
        if (afterCmd < result.length && /[a-zA-Z]/.test(result[afterCmd])) { idx = afterCmd; continue; }
        if (def.args === 0) {
          result = result.substring(0, pos) + def.template + result.substring(afterCmd);
          changed = true;
        } else {
          const parsed = extractArgs(result, afterCmd, def.args);
          if (!parsed) { idx = afterCmd; continue; }
          let expanded = def.template;
          for (let i = 0; i < parsed.args.length; i++) {
            expanded = expanded.replace(new RegExp('#' + (i + 1), 'g'), parsed.args[i]);
          }
          result = result.substring(0, pos) + expanded + result.substring(parsed.end);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return result;
}

// ─── Process inline LaTeX to HTML ────────────────────────────────────────────
function processInline(text, colors) {
  let s = text;

  // Handle brace groups with formatting commands: {\cmd ...content...}
  // We need a proper parser for these since they can contain nested braces
  s = processFormattingGroups(s, colors);

  // Inline math: $...$
  s = s.replace(/\$([^\$]+?)\$/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
    catch { return math; }
  });

  // \textcolor{color}{text}
  s = s.replace(/\\textcolor\{(\w+)\}\{([^}]*)\}/g, (_, c, t) => `<span style="color:${colors[c] || c}">${t}</span>`);
  // \colorbox
  s = s.replace(/\\colorbox\{(\w+)\}\{([^}]*)\}/g, (_, c, t) => `<span style="background:${colors[c] || c};padding:2px 6px;border-radius:3px">${t}</span>`);
  // Text formatting
  s = s.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
  s = s.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
  s = s.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>');
  s = s.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>');
  s = s.replace(/\\texttt\{([^}]*)\}/g, '<code class="latex-inline-code">$1</code>');
  s = s.replace(/\\textsc\{([^}]*)\}/g, '<span style="font-variant:small-caps">$1</span>');
  // Links
  s = s.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, '<a href="$1" style="color:var(--color-brand,#2563eb)" target="_blank">$2</a>');
  s = s.replace(/\\url\{([^}]*)\}/g, '<a href="$1" style="color:var(--color-brand,#2563eb)" target="_blank">$1</a>');
  // \footnote
  s = s.replace(/\\footnote\{([^}]*)\}/g, '<sup style="color:var(--color-brand);cursor:help" title="$1">*</sup>');
  // \rule{w}{h} → horizontal line
  s = s.replace(/\\rule\{[^}]*\}\{[^}]*\}/g, '<hr style="border:none;border-top:1px solid var(--color-border-primary,#ddd);margin:8px 0"/>');
  // Font size/style commands (standalone, no arg)
  s = s.replace(/\\(?:Huge|LARGE|Large|large|normalsize|small|footnotesize|scriptsize|tiny)\b/g, '');
  s = s.replace(/\\(?:bfseries|itshape|scshape|ttfamily|mdseries|upshape|rmfamily|sffamily|lmfamily)\b/g, '');
  // Spacing
  s = s.replace(/\\[hv]space\*?\{[^}]*\}/g, '');
  s = s.replace(/\\(?:smallskip|medskip|bigskip|noindent|centering|raggedright|raggedleft)\b/g, '');
  s = s.replace(/\\(?:Needspace|needspace)\{[^}]*\}/g, '');
  s = s.replace(/\\(?:vfill|hfill|fill)\b/g, '');
  // Separators
  s = s.replace(/\\ /g, '&nbsp;');
  s = s.replace(/\\\|/g, ' | ');
  s = s.replace(/\\,/g, ' ');
  s = s.replace(/\\;/g, ' ');
  s = s.replace(/\\quad\b/g, '&emsp;');
  s = s.replace(/\\qquad\b/g, '&emsp;&emsp;');
  s = s.replace(/~/g, '&nbsp;');
  // Special chars
  s = s.replace(/\\&/g, '&amp;');
  s = s.replace(/\\\$/g, '$');
  s = s.replace(/\\%/g, '%');
  s = s.replace(/\\#/g, '#');
  s = s.replace(/\\_/g, '_');
  s = s.replace(/\\textbullet/g, '•');
  s = s.replace(/\\cdot/g, '·');
  s = s.replace(/\\textendash/g, '–');
  s = s.replace(/\\textemdash/g, '—');
  s = s.replace(/---/g, '—');
  s = s.replace(/--/g, '–');
  s = s.replace(/``/g, '\u201c');
  s = s.replace(/''/g, '\u201d');
  // Line breaks
  s = s.replace(/\\\\(\[\d+[a-z]*\])?/g, '<br/>');
  s = s.replace(/\\newline/g, '<br/>');
  // Strip dimension brackets like [3pt], [0.5em]
  s = s.replace(/\[[\d.]+(?:pt|em|ex|mm|cm|in)\]/g, '');
  // Strip remaining unknown \cmd{arg}
  s = s.replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, '$1');
  // Strip remaining unknown \cmd
  s = s.replace(/\\[a-zA-Z]+\*?/g, '');
  // Clean leftover brace groups
  s = s.replace(/\{([^{}]*)\}/g, '$1');
  // Convert newlines to breaks
  s = s.replace(/\n/g, '<br/>');
  return s;
}

// Process brace-group formatting like {\Huge\bfseries text}, {\color{navy}text}, etc.
function processFormattingGroups(text, colors) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '{') {
      // Try to parse a formatting group
      const group = extractBraceGroup(text, i);
      if (group) {
        const inner = group.content.trim();
        const processed = processGroupContent(inner, colors);
        if (processed !== null) {
          result += processed;
          i = group.end;
          continue;
        }
      }
    }
    result += text[i];
    i++;
  }
  return result;
}

function processGroupContent(inner, colors) {
  // {\color{name} ...content...}
  const colorMatch = inner.match(/^\\color\{(\w+)\}\s*([\s\S]*)$/);
  if (colorMatch) {
    const col = colors[colorMatch[1]] || colorMatch[1];
    const content = processInline(colorMatch[2], colors);
    return `<span style="color:${col}">${content}</span>`;
  }
  // {\Huge\bfseries text} or {\Large\bfseries text}
  const hugeBoldMatch = inner.match(/^\\(?:Huge|LARGE|Large|large)\s*\\bfseries\s+([\s\S]*)$/);
  if (hugeBoldMatch) return `<span style="font-size:28px;font-weight:700">${processInline(hugeBoldMatch[1], colors)}</span>`;
  // {\Huge text}
  const hugeMatch = inner.match(/^\\(?:Huge|LARGE|Large|large)\s+([\s\S]*)$/);
  if (hugeMatch) return `<span style="font-size:24px">${processInline(hugeMatch[1], colors)}</span>`;
  // {\bfseries text}
  const bfMatch = inner.match(/^\\bfseries\s+([\s\S]*)$/);
  if (bfMatch) return `<strong>${processInline(bfMatch[1], colors)}</strong>`;
  // {\itshape text}
  const itMatch = inner.match(/^\\itshape\s+([\s\S]*)$/);
  if (itMatch) return `<em>${processInline(itMatch[1], colors)}</em>`;
  // {\ttfamily text}
  const ttMatch = inner.match(/^\\ttfamily\s+([\s\S]*)$/);
  if (ttMatch) return `<code>${processInline(ttMatch[1], colors)}</code>`;
  // {\scshape text}
  const scMatch = inner.match(/^\\scshape\s+([\s\S]*)$/);
  if (scMatch) return `<span style="font-variant:small-caps">${processInline(scMatch[1], colors)}</span>`;
  // {\small text}
  const smallMatch = inner.match(/^\\(?:small|footnotesize|scriptsize|tiny)\s+([\s\S]*)$/);
  if (smallMatch) return `<span style="font-size:12px">${processInline(smallMatch[1], colors)}</span>`;
  // No recognized command — return null so the brace group is preserved
  return null;
}

// Strip \newcommand definitions from body (they've already been parsed)
function stripNewCommandDefs(text) {
  let result = text;
  const re = /\\newcommand\{[^}]*\}(\[\d+\])?/g;
  let m;
  // Process from end to start to avoid index shifting
  const matches = [];
  while ((m = re.exec(result)) !== null) matches.push(m);
  for (let k = matches.length - 1; k >= 0; k--) {
    const match = matches[k];
    let end = match.index + match[0].length;
    // Skip whitespace and %comments to find the template brace group
    while (end < result.length && (result[end] === '%' || result[end] === ' ' || result[end] === '\n' || result[end] === '\r' || result[end] === '\t')) {
      if (result[end] === '%') { while (end < result.length && result[end] !== '\n') end++; }
      end++;
    }
    // Remove the brace group (template)
    if (end < result.length && result[end] === '{') {
      const g = extractBraceGroup(result, end);
      if (g) end = g.end;
    }
    result = result.substring(0, match.index) + result.substring(end);
  }
  return result;
}

// ─── LaTeX Renderer ──────────────────────────────────────────────────────────
export function renderLatex(code) {
  if (!code || !code.trim()) return '';

  // Parse colors from full document
  const colors = {};
  const cRe = /\\definecolor\{(\w+)\}\{HTML\}\{([A-Fa-f0-9]+)\}/g;
  let cm;
  while ((cm = cRe.exec(code)) !== null) colors[cm[1]] = '#' + cm[2];

  // Parse custom commands from full document
  const customCmds = parseNewCommands(code);

  // Extract body between \begin{document} and \end{document}
  let body = code;
  const docMatch = code.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (docMatch) body = docMatch[1];

  // Strip all preamble/layout commands
  const stripPatterns = [
    /\\documentclass(\[[^\]]*\])?\{[^}]*\}/g,
    /\\usepackage(\[[^\]]*\])?\{[^}]*\}/g,
    /\\definecolor\{[^}]*\}\{[^}]*\}\{[^}]*\}/g,
    /\\setlength\{[^}]*\}\{[^}]*\}/g,
    /\\pagestyle\{[^}]*\}/g,
    /\\pagenumbering\{[^}]*\}/g,
    /\\geometry\{[^}]*\}/g,
    /\\maketitle/g,
    /\\begin\{document\}/g,
    /\\end\{document\}/g,
    // Remove comments (anything after % that is not escaped)
    /(^|[^\\])%.*/g,
  ];
  for (const p of stripPatterns) body = body.replace(p, '');
  // Multi-line preamble commands
  body = body.replace(/\\titleformat[\s\S]*?(?=\\[a-zA-Z]|\n\n)/g, '');
  body = body.replace(/\\titlespacing\*?[\s\S]*?(?=\\[a-zA-Z]|\n\n)/g, '');
  body = body.replace(/\\newcolumntype\{[^}]*\}\{[^}]*\}/g, '');
  body = body.replace(/\\renewcommand\*?\{[^}]*\}(\[[^\]]*\])?\{[^}]*\}/g, '');
  body = body.replace(/\\hypersetup\{[\s\S]*?\}/g, '');
  // Strip \setlist with brace-aware matching
  body = body.replace(/\\setlist(\[[^\]]*\])?\{[\s\S]*?\n\}/g, '');
  // Strip \newcommand definitions entirely (already parsed above)
  body = stripNewCommandDefs(body);
  // Remove leftover \newcommand templates by finding orphaned brace groups after stripping
  body = body.replace(/\\pretocmd\{[^}]*\}\{[^}]*\}\{[^}]*\}\{[^}]*\}/g, '');
  body = body.replace(/\\widowpenalty\s*=\s*\d+/g, '');
  body = body.replace(/\\clubpenalty\s*=\s*\d+/g, '');
  body = body.replace(/\\displaywidowpenalty\s*=\s*\d+/g, '');

  // Expand custom commands
  body = expandCustomCommands(body, customCmds);

  let html = '';

  // Strip wrapping environments like table and figure that just contain other elements
  // We do this before processing to avoid them falling into the unknown environment trap
  body = body.replace(/\\begin\{(?:table|table\*|figure|figure\*)\}(\[[^\]]*\])?\s*/g, '');
  body = body.replace(/\\end\{(?:table|table\*|figure|figure\*)\}\s*/g, '');
  // Strip \caption{...} and \centering inside these
  body = body.replace(/\\caption\{[^}]*\}\s*/g, '');
  body = body.replace(/\\centering\s*/g, '');

  // Process environments first
  // Tables: tabular, tabularx
  const braceArg = '(\\{(?:[^{}]|\\{[^{}]*\\})*\\})?';
  const tableRe = new RegExp('\\\\begin\\{tabular[x]?\\}' + braceArg + braceArg + '\\s*([\\s\\S]*?)\\\\end\\{tabular[x]?\\}', 'g');
  let firstRow = true;
  body = body.replace(tableRe, (_, _w, _c, tc) => {
    let t = '<table><tbody>';
    firstRow = true;
    for (const row of tc.split(/\\\\\s*(?:\[[^\]]*\])?/)) {
      const clean = row.replace(/\\hline|\\toprule|\\midrule|\\bottomrule|\\cline\{[^}]*\}/g, '').trim();
      if (!clean) continue;
      if (firstRow) {
        t += '<tr>' + clean.split('&').map(c => `<th>${processInline(c.trim(), colors)}</th>`).join('') + '</tr>';
        firstRow = false;
      } else {
        t += '<tr>' + clean.split('&').map(c => `<td>${processInline(c.trim(), colors)}</td>`).join('') + '</tr>';
      }
    }
    return t + '</tbody></table>';
  });
  // Lists
  body = body.replace(/\\begin\{itemize\}(\[[^\]]*\])?\s*([\s\S]*?)\\end\{itemize\}/g, (_, _o, lc) =>
    '<ul>' + lc.split(/\\item(\[[^\]]*\])?/).filter((x, i) => i % 2 === 0 && x && x.trim()).map(i => `<li>${processInline(i.trim(), colors)}</li>`).join('') + '</ul>');
  body = body.replace(/\\begin\{enumerate\}(\[[^\]]*\])?\s*([\s\S]*?)\\end\{enumerate\}/g, (_, _o, lc) =>
    '<ol>' + lc.split(/\\item(\[[^\]]*\])?/).filter((x, i) => i % 2 === 0 && x && x.trim()).map(i => `<li>${processInline(i.trim(), colors)}</li>`).join('') + '</ol>');
  // Center
  body = body.replace(/\\begin\{center\}\s*([\s\S]*?)\\end\{center\}/g, (_, c) => `<div style="text-align:center">${processInline(c.trim(), colors)}</div>`);
  // Quote
  body = body.replace(/\\begin\{(?:quote|quotation)\}\s*([\s\S]*?)\\end\{(?:quote|quotation)\}/g, (_, c) => `<blockquote>${processInline(c.trim(), colors)}</blockquote>`);
  // Verbatim
  body = body.replace(/\\begin\{verbatim\}\s*([\s\S]*?)\\end\{verbatim\}/g, (_, c) => `<pre><code>${c.replace(/</g, '&lt;')}</code></pre>`);
  // Math environments
  body = body.replace(/\\begin\{(equation|align|gather|math|displaymath)\*?\}\s*([\s\S]*?)\\end\{\1\*?\}/g, (_, _e, mc) => {
    try { return `<div class="latex-math-block">${katex.renderToString(mc.trim(), { displayMode: true, throwOnError: false })}</div>`; }
    catch { return '<div class="latex-math-block" style="color:#ef4444">Math error</div>'; }
  });
  // Minipage — just render content
  body = body.replace(/\\begin\{minipage\}(\[[^\]]*\])?\{[^}]*\}\s*([\s\S]*?)\\end\{minipage\}/g, (_, _o, c) => processInline(c.trim(), colors));
  // Strip any remaining unknown environments
  body = body.replace(/\\begin\{(\w+)\}(\[[^\]]*\])?(\{[^}]*\})?\s*([\s\S]*?)\\end\{\1\}/g, (_, _n, _o, _a, c) => processInline(c.trim(), colors));

  // Process blocks
  for (const block of body.split(/\n\n+/)) {
    const t = block.trim();
    if (!t) continue;
    if (t.startsWith('<')) { html += t; continue; }
    // Display math
    if (t.startsWith('$$') || t.startsWith('\\[')) {
      const clean = t.replace(/^\$\$|\$\$$/g, '').replace(/^\\\[|\\\]$/g, '').trim();
      try { html += `<div class="latex-math-block">${katex.renderToString(clean, { displayMode: true, throwOnError: false })}</div>`; }
      catch { html += '<div class="latex-math-block" style="color:#ef4444">Math error</div>'; }
    }
    // Section headings
    else if (/^\\section\*?\{/.test(t)) html += `<h2>${processInline(extractFirstBraceContent(t, 'section'), colors)}</h2>`;
    else if (/^\\subsection\*?\{/.test(t)) html += `<h3>${processInline(extractFirstBraceContent(t, 'subsection'), colors)}</h3>`;
    else if (/^\\subsubsection\*?\{/.test(t)) html += `<h4>${processInline(extractFirstBraceContent(t, 'subsubsection'), colors)}</h4>`;
    else if (/^\\title\{/.test(t)) html += `<h1>${processInline(extractFirstBraceContent(t, 'title'), colors)}</h1>`;
    else if (/^\\paragraph\*?\{/.test(t)) html += `<h5>${processInline(extractFirstBraceContent(t, 'paragraph'), colors)}</h5>`;
    // Horizontal rule
    else if (/^\\(hrule|rule\{)/.test(t)) html += '<hr/>';
    // Items not in an environment
    else if (t.includes('\\item')) {
      html += '<ul>' + t.split(/\\item(\[[^\]]*\])?/).filter((x, i) => i % 2 === 0 && x && x.trim()).map(i => `<li>${processInline(i.trim(), colors)}</li>`).join('') + '</ul>';
    }
    // Regular paragraph
    else html += `<p>${processInline(t, colors)}</p>`;
  }
  return html;
}

// Extract content from \command{...} using brace-depth matching
function extractFirstBraceContent(text, cmd) {
  const re = new RegExp('\\\\' + cmd + '\\*?');
  const m = re.exec(text);
  if (!m) return text;
  let i = m.index + m[0].length;
  while (i < text.length && text[i] !== '{') i++;
  const g = extractBraceGroup(text, i);
  return g ? g.content : text;
}
