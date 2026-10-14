import { describe, it, expect } from 'vitest';
import { sanitizeMermaidCode } from './mermaid-sanitize.js';

describe('sanitizeMermaidCode', () => {
  it('preserves open links (---) instead of mangling them into "- --"', () => {
    const input = 'graph LR\n  Anode1["Anode (Graphite)"] --- LiqElec1["Liquid Electrolyte"]';
    const out = sanitizeMermaidCode(input);
    expect(out).toContain('Anode1["Anode (Graphite)"]');
    expect(out).toContain('LiqElec1["Liquid Electrolyte"]');
    expect(out).toContain('---');
    expect(out).not.toMatch(/-\s+--/); // the exact bug: "] - --  Liq"
  });

  it('still fixes unquoted multi-word node names on arrows', () => {
    const out = sanitizeMermaidCode('graph TD\n  Data Plane --> Control Plane');
    expect(out).toContain('Data_Plane["Data Plane"]');
    expect(out).toContain('Control_Plane["Control Plane"]');
  });

  it('leaves normal arrows intact', () => {
    const out = sanitizeMermaidCode('graph TD\n  A --> B');
    expect(out).toContain('A --> B');
  });

  it('handles the exact failing battery diagram (subgraphs + --- links)', () => {
    const input = [
      'graph LR',
      '    subgraph Li_ion["Current Lithium-Ion Battery"]',
      '        Anode1["Anode (Graphite)"] --- LiqElec1["Liquid Electrolyte"]',
      '        LiqElec1 --- Sep["Porous Separator"]',
      '        Sep --- LiqElec2["Liquid Electrolyte"]',
      '        LiqElec2 --- Cathode1["Cathode"]',
      '    end',
      '    subgraph Solid_State["Solid-State Battery"]',
      '        Anode2["Anode (Lithium Metal)"] --- SolElec["Solid Electrolyte (Ceramic/Glass)"]',
      '        SolElec --- Cathode2["Cathode"]',
      '    end',
    ].join('\n');
    const out = sanitizeMermaidCode(input);
    expect(out).not.toMatch(/-\s+--/);           // the "] - --" mangle must be gone
    expect(out).toContain('Anode1["Anode (Graphite)"] --- LiqElec1["Liquid Electrolyte"]');
    expect(out).toContain('SolElec --- Cathode2["Cathode"]');
  });
});
