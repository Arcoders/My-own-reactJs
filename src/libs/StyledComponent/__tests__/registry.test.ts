import { describe, it, expect, afterEach } from 'vitest';
import { registerStyles, releaseStyles, registerRawRules, unregisterRawRules, _peekStyles } from '../registry';

afterEach(() => {
  // Drop every entry between tests so the sheet starts clean.
  for (const { key } of _peekStyles()) {
    // Each entry might have been ref'd N times; release until gone.
    while (_peekStyles().find((e) => e.key === key)) releaseStyles(key);
  }
  document.head.innerHTML = '';
});

describe('registry refcount', () => {
  it('returns the same className for identical CSS and counts refs', () => {
    const a = registerStyles('color: red;');
    const b = registerStyles('color: red;');
    expect(a).toBe(b);
    const entry = _peekStyles().find((e) => e.className === a);
    expect(entry?.refcount).toBe(2);
  });

  it('decrements on release and removes the entry at zero', () => {
    const css = 'color: green;';
    registerStyles(css);
    registerStyles(css);
    releaseStyles(css);
    expect(_peekStyles().find((e) => e.key === css)?.refcount).toBe(1);
    releaseStyles(css);
    expect(_peekStyles().find((e) => e.key === css)).toBeUndefined();
  });

  it('inserts rules into the live stylesheet', () => {
    registerStyles('color: red; &:hover { color: blue; }');
    const sheet = document.querySelector('style[data-styled=reactisma]') as HTMLStyleElement;
    expect(sheet).toBeTruthy();
    const text = Array.from(sheet.sheet!.cssRules).map((r) => r.cssText).join('\n');
    expect(text).toMatch(/\.rsx-.+ \{ color: red/);
    expect(text).toMatch(/\.rsx-.+:hover \{ color: blue/);
  });

  it('registerRawRules emits unscoped rules and unregister removes them', () => {
    const handle = registerRawRules('body { background: pink; } * { box-sizing: border-box; }');
    const sheet = document.querySelector('style[data-styled=reactisma]') as HTMLStyleElement;
    const before = Array.from(sheet.sheet!.cssRules).map((r) => r.cssText).join('\n');
    expect(before).toContain('body');
    expect(before).toContain('background: pink');
    unregisterRawRules(handle);
    const after = Array.from(sheet.sheet!.cssRules).map((r) => r.cssText).join('\n');
    expect(after).not.toContain('background: pink');
  });
});
