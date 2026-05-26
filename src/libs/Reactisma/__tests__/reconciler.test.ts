import { describe, it, expect } from 'vitest';
import { render, flushAsync } from './testing-utils';
import Reactisma from '..';

const { useState, createElement } = Reactisma;

describe('keyed reconciler', () => {
  it('preserves DOM nodes when a keyed list is reversed', async () => {
    let setItems!: (xs: number[]) => void;
    const App = () => {
      const [items, set] = useState([0, 1, 2, 3, 4]);
      setItems = set;
      return createElement(
        'ul',
        {},
        ...items.map((n) => createElement('li', { key: n }, String(n)))
      );
    };
    const { container } = render(App);
    const first = container.querySelector('li')!;
    expect(first.textContent).toBe('0');
    setItems([4, 3, 2, 1, 0]);
    await flushAsync();
    // Find the node that previously was `0`. It should still exist, with the same textContent.
    const lis = Array.from(container.querySelectorAll('li'));
    expect(lis[lis.length - 1]).toBe(first);
    expect(lis.map((n) => n.textContent).join(',')).toBe('4,3,2,1,0');
  });

  it('falls back to index reconciliation when no keys are present', async () => {
    let setItems!: (xs: string[]) => void;
    const App = () => {
      const [items, set] = useState(['a', 'b', 'c']);
      setItems = set;
      return createElement(
        'ul',
        {},
        ...items.map((s) => createElement('li', {}, s))
      );
    };
    const { container } = render(App);
    setItems(['a', 'b']);
    await flushAsync();
    expect(container.querySelectorAll('li').length).toBe(2);
  });

  it('removes a keyed item without disturbing the others', async () => {
    let setItems!: (xs: number[]) => void;
    const App = () => {
      const [items, set] = useState([1, 2, 3]);
      setItems = set;
      return createElement(
        'div',
        {},
        ...items.map((n) => createElement('span', { key: n }, String(n)))
      );
    };
    const { container } = render(App);
    const span1 = container.querySelectorAll('span')[0] as HTMLSpanElement;
    const span3 = container.querySelectorAll('span')[2] as HTMLSpanElement;
    setItems([1, 3]);
    await flushAsync();
    const spans = Array.from(container.querySelectorAll('span'));
    expect(spans).toHaveLength(2);
    expect(spans[0]).toBe(span1);
    expect(spans[1]).toBe(span3);
  });
});
