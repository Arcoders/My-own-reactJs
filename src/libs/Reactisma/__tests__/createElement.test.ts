import { describe, it, expect } from 'vitest';
import createElement from '../core/create-element';

describe('createElement', () => {
  it('returns a VNode with type, props and flattened children', () => {
    const vnode = createElement('div', { id: 'a' }, 'hello', ['world']);
    expect(vnode.type).toBe('div');
    expect(vnode.props.id).toBe('a');
    expect(vnode.children).toHaveLength(2);
    expect(vnode.children[0].type).toBe('text');
    expect(vnode.children[0].props.textContent).toBe('hello');
    expect(vnode.children[1].props.textContent).toBe('world');
  });

  it('extracts the `key` from attributes into VNode.key', () => {
    const vnode = createElement('li', { key: 42, id: 'x' });
    expect(vnode.key).toBe(42);
    expect(vnode.props.key).toBeUndefined();
    expect(vnode.props.id).toBe('x');
  });

  it('drops whitespace-only string children', () => {
    const vnode = createElement('div', null, '   ', 'a');
    expect(vnode.children).toHaveLength(1);
    expect(vnode.children[0].props.textContent).toBe('a');
  });

  it('skips null, undefined and boolean children', () => {
    const vnode = createElement('div', null, null, undefined, false, 'kept');
    expect(vnode.children).toHaveLength(1);
    expect(vnode.children[0].props.textContent).toBe('kept');
  });

  it('accepts a null attributes object', () => {
    expect(() => createElement('div', null, 'x')).not.toThrow();
  });
});
