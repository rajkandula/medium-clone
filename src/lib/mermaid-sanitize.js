/**
 * Sanitize Mermaid code to fix common AI-generated syntax issues.
 * 
 * The main problem: LLMs generate node names with spaces like:
 *   Data Plane -->|Mutates| Control Plane
 * But Mermaid requires either no spaces or bracket notation:
 *   Data_Plane["Data Plane"] -->|Mutates| Control_Plane["Control Plane"]
 *
 * This function auto-fixes these patterns while preserving already-valid syntax.
 */
export function sanitizeMermaidCode(code) {
  if (!code || typeof code !== 'string') return code;

  const lines = code.split('\n');
  const result = [];

  for (let line of lines) {
    const trimmed = line.trim();

    // Skip directive/config lines, comments, empty lines, and graph declarations
    if (
      !trimmed ||
      trimmed.startsWith('%%') ||
      trimmed.startsWith('classDef') ||
      trimmed.startsWith('class ') ||
      trimmed.startsWith('style ') ||
      trimmed.startsWith('click ') ||
      trimmed.startsWith('subgraph') ||
      trimmed === 'end' ||
      /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|mindmap|timeline|sankey|quadrantChart|xychart)\b/i.test(trimmed)
    ) {
      result.push(line);
      continue;
    }

    // For lines containing arrow connections, fix unquoted multi-word node names
    // Split by semicolons first to handle multiple statements per line
    const statements = line.split(';');
    const fixedStatements = statements.map(stmt => fixStatement(stmt));
    result.push(fixedStatements.join(';'));
  }

  return result.join('\n');
}

/**
 * Fix a single Mermaid statement that may contain multi-word unquoted node names.
 */
function fixStatement(stmt) {
  const trimmed = stmt.trim();
  if (!trimmed) return stmt;

  // Match arrow patterns: -->, --->, -.->  ==>  -->|label|  etc.
  const arrowPattern = /(\s*)(--+>|==+>|--+\|[^|]*\||-\.->?|-->|==>|---+|\.\.>)/g;

  if (!arrowPattern.test(trimmed)) {
    // No arrows — might be a standalone node definition, leave as-is
    return stmt;
  }

  // Split by arrows while keeping them
  const parts = trimmed.split(/(--+>|==+>|--+\|[^|]*\||-\.->?|\.\.>|---+)/);

  const fixed = parts.map((part, idx) => {
    // Even indices are node references, odd indices are arrows
    if (idx % 2 !== 0) return part; // arrow — keep as-is

    return fixNodeReference(part.trim());
  });

  // Reconstruct preserving original leading whitespace
  const leadingWs = stmt.match(/^(\s*)/)?.[1] || '';
  return leadingWs + fixed.join(' ');
}

/**
 * Fix a node reference. If it already has brackets ["..."] or (..."...) leave it.
 * If it contains spaces and no brackets, convert to ID["Label"] format.
 */
function fixNodeReference(node) {
  if (!node) return node;

  // Already has bracket notation — e.g. NodeID["Label"] or NodeID("Label") or NodeID{"Label"}
  if (/[\[({]/.test(node)) return node;

  // Single word — fine as-is
  if (!/\s/.test(node)) return node;

  // Multi-word without brackets — convert "Data Plane" → Data_Plane["Data Plane"]
  const label = node.trim();
  const id = label.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  return `${id}["${label}"]`;
}
