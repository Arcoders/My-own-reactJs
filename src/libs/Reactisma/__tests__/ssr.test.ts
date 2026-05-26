import { describe, it, expect } from 'vitest';
import Reactisma from '..';

const { createElement, renderToString } = Reactisma;

describe('renderToString', () => {
  it('serializes a basic element', () => {
    const Comp = () => createElement('div', { id: 'a' }, 'hello');
    const html = renderToString(Comp);
    expect(html).toBe('<div id="a">hello</div>');
  });

  it('escapes HTML in text and attributes', () => {
    const Comp = () =>
      createElement('div', { title: 'a"b<c>d' }, '<script>alert(1)</script>');
    const html = renderToString(Comp);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;');
  });

  it('omits event handler props and refs', () => {
    const Comp = () =>
      createElement('button', { onClick: () => undefined, ref: { current: null } }, 'x');
    const html = renderToString(Comp);
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('ref');
  });

  it('handles void elements correctly', () => {
    const Comp = () => createElement('img', { src: 'a.png', alt: 'a' });
    const html = renderToString(Comp);
    expect(html).toBe('<img src="a.png" alt="a">');
  });

  it('renders className as class', () => {
    const Comp = () => createElement('div', { className: 'foo bar' }, 'x');
    const html = renderToString(Comp);
    expect(html).toContain('class="foo bar"');
  });

  it('renders style object as inline string', () => {
    const Comp = () =>
      createElement(
        'div',
        { style: { color: 'red', backgroundColor: 'blue' } },
        'x'
      );
    const html = renderToString(Comp);
    expect(html).toContain('color: red');
    expect(html).toContain('background-color: blue');
  });

  it('skips boolean false attributes and emits true as empty', () => {
    const Comp = () =>
      createElement('div', null,
        createElement('input', { disabled: true, hidden: false })
      );
    const html = renderToString(Comp);
    expect(html).toContain('<input disabled>');
    expect(html).not.toContain('hidden');
  });
});
