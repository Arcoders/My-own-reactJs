import { describe, it, expect } from 'vitest';
import { parseCss, expandRules } from '../parser';

describe('parseCss', () => {
  it('parses a flat declaration list', () => {
    const r = parseCss('color: red; background: blue;');
    expect(r.rootDeclarations).toBe('color: red; background: blue;');
    expect(r.nestedBlocks).toHaveLength(0);
  });

  it('extracts a single nested block', () => {
    const r = parseCss('color: red; &:hover { color: blue; }');
    expect(r.rootDeclarations).toBe('color: red;');
    expect(r.nestedBlocks).toHaveLength(1);
    expect(r.nestedBlocks[0].selector).toBe('&:hover');
    expect(r.nestedBlocks[0].declarations).toBe('color: blue;');
  });

  it('handles vendor-prefixed pseudo elements', () => {
    const r = parseCss('&::-webkit-slider-thumb { background: white; }');
    expect(r.nestedBlocks[0].selector).toBe('&::-webkit-slider-thumb');
  });

  it('handles @media at-rules', () => {
    const r = parseCss('color: red; @media (min-width: 800px) { color: blue; }');
    expect(r.nestedBlocks[0].selector).toBe('@media (min-width: 800px)');
    expect(r.nestedBlocks[0].declarations).toBe('color: blue;');
  });
});

describe('expandRules', () => {
  it('emits a base rule and a hover rule', () => {
    const rules = expandRules('rsx-abc', {
      rootDeclarations: 'color: red;',
      nestedBlocks: [{ selector: '&:hover', declarations: 'color: blue;' }],
    });
    expect(rules).toEqual([
      '.rsx-abc { color: red; }',
      '.rsx-abc:hover { color: blue; }',
    ]);
  });

  it('wraps @media around the base selector', () => {
    const rules = expandRules('rsx-x', {
      rootDeclarations: '',
      nestedBlocks: [{ selector: '@media (min-width: 800px)', declarations: 'color: blue;' }],
    });
    expect(rules[0]).toBe('@media (min-width: 800px) { .rsx-x { color: blue; } }');
  });

  it('expands comma-separated selectors', () => {
    const rules = expandRules('rsx-x', {
      rootDeclarations: '',
      nestedBlocks: [{ selector: '&:hover, &:focus', declarations: 'color: blue;' }],
    });
    expect(rules[0]).toBe('.rsx-x:hover, .rsx-x:focus { color: blue; }');
  });
});
