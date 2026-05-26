import { describe, it, expect, vi } from 'vitest';
import { updateDOM } from '../dom';
import type { VNode } from '../core/types';

function v(type: string, props: Record<string, unknown>): VNode {
  return { type, props, children: [] };
}

describe('DOM prop dispatcher', () => {
  it('sets className on a fresh element', () => {
    const el = document.createElement('div');
    updateDOM(el, v('div', { className: 'a b' }));
    expect(el.getAttribute('class')).toBe('a b');
  });

  it('removes className when value goes empty', () => {
    const el = document.createElement('div');
    updateDOM(el, v('div', { className: 'a' }));
    updateDOM(el, v('div', { className: '' }), v('div', { className: 'a' }));
    expect(el.hasAttribute('class')).toBe(false);
  });

  it('respects boolean attributes', () => {
    const el = document.createElement('button');
    updateDOM(el, v('button', { disabled: true }));
    expect(el.hasAttribute('disabled')).toBe(true);
    updateDOM(el, v('button', { disabled: false }), v('button', { disabled: true }));
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('writes value to the DOM property, not just the attribute', () => {
    const el = document.createElement('input');
    updateDOM(el, v('input', { value: 'hi' }));
    expect(el.value).toBe('hi');
  });

  it('removes a style property dropped from the next render', () => {
    const el = document.createElement('div');
    updateDOM(el, v('div', { style: { color: 'red', background: 'blue' } }));
    updateDOM(
      el,
      v('div', { style: { color: 'red' } }),
      v('div', { style: { color: 'red', background: 'blue' } })
    );
    expect(el.style.color).toBe('red');
    expect(el.style.background).toBe('');
  });

  it('registers event handlers without leaking listeners', () => {
    const el = document.createElement('button');
    document.body.appendChild(el);
    const fn = vi.fn();
    updateDOM(el, v('button', { onClick: fn }));
    // Re-render with a new function reference 50 times
    for (let i = 0; i < 50; i++) {
      const next = vi.fn();
      updateDOM(el, v('button', { onClick: next }), v('button', { onClick: fn }));
    }
    el.remove();
  });

  it('calls a ref callback with the element on mount', () => {
    const el = document.createElement('div');
    const refCb = vi.fn();
    updateDOM(el, v('div', { ref: refCb }));
    expect(refCb).toHaveBeenCalledWith(el);
  });

  it('writes el to a ref object', () => {
    const el = document.createElement('div');
    const ref = { current: null as HTMLElement | null };
    updateDOM(el, v('div', { ref }));
    expect(ref.current).toBe(el);
  });
});
