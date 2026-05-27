import { describe, it, expect, vi } from 'vitest';
import { render, flushAsync, fireClick } from './testing-utils';
import Reactisma from '..';

const { useState, useReducer, useMemo, useEffect, useRef, createContext, useContext } = Reactisma;

describe('hooks', () => {
  it('useState renders and updates', async () => {
    const Comp = () => {
      const [n, setN] = useState(0);
      return Reactisma.createElement(
        'button',
        { onClick: () => setN(n + 1) },
        String(n)
      );
    };
    const { container } = render(Comp);
    const btn = container.querySelector('button')!;
    expect(btn.textContent).toBe('0');
    fireClick(btn);
    await flushAsync();
    expect(btn.textContent).toBe('1');
  });

  it('useState bails out on Object.is equality', async () => {
    const renders = vi.fn();
    const Comp = () => {
      const [n, setN] = useState(0);
      renders();
      return Reactisma.createElement(
        'button',
        { onClick: () => setN(0) },
        String(n)
      );
    };
    const { container } = render(Comp);
    const initialCalls = renders.mock.calls.length;
    fireClick(container.querySelector('button')!);
    await flushAsync();
    fireClick(container.querySelector('button')!);
    await flushAsync();
    expect(renders.mock.calls.length).toBe(initialCalls);
  });

  it('useReducer dispatches actions', async () => {
    type A = { type: 'inc' } | { type: 'reset'; v: number };
    const Comp = () => {
      const [n, dispatch] = useReducer(
        (s: number, a: A) => (a.type === 'inc' ? s + 1 : a.v),
        0
      );
      return Reactisma.createElement(
        'div',
        {},
        Reactisma.createElement('span', {}, String(n)),
        Reactisma.createElement('button', { onClick: () => dispatch({ type: 'inc' }) }, '+')
      );
    };
    const { container } = render(Comp);
    const span = container.querySelector('span')!;
    expect(span.textContent).toBe('0');
    fireClick(container.querySelector('button')!);
    await flushAsync();
    expect(span.textContent).toBe('1');
  });

  it('useMemo recomputes only when deps change', async () => {
    const factory = vi.fn(() => 'computed');
    const Comp = (props: { tick: number }) => {
      const v = useMemo(factory, []);
      return Reactisma.createElement('span', {}, `${v}:${props.tick}`);
    };
    const App = () => {
      const [t, setT] = useState(0);
      return Reactisma.createElement(
        'div',
        {},
        Reactisma.createElement(Comp, { tick: t }),
        Reactisma.createElement('button', { onClick: () => setT(t + 1) }, 'bump')
      );
    };
    const { container } = render(App);
    expect(factory).toHaveBeenCalledTimes(1);
    fireClick(container.querySelector('button')!);
    await flushAsync();
    expect(factory).toHaveBeenCalledTimes(1); // still memoed
  });

  it('useRef keeps stable identity', async () => {
    let ref1: { current: number } | undefined;
    let ref2: { current: number } | undefined;
    const Comp = () => {
      const r = useRef(0);
      if (!ref1) ref1 = r;
      else ref2 = r;
      return Reactisma.createElement('span', {}, String(r.current));
    };
    const result = render(Comp);
    result.rerender();
    await flushAsync();
    expect(ref1).toBe(ref2);
  });

  it('useEffect runs and cleans up', async () => {
    const mounted = vi.fn();
    const cleaned = vi.fn();
    const Comp = () => {
      useEffect(() => {
        mounted();
        return () => cleaned();
      }, []);
      return Reactisma.createElement('span', {}, 'x');
    };
    const result = render(Comp);
    await flushAsync();
    expect(mounted).toHaveBeenCalledTimes(1);
    result.unmount();
    expect(cleaned).toHaveBeenCalledTimes(1);
  });

  it('useContext reads provider value', async () => {
    const Ctx = createContext('default');
    const Reader = () => Reactisma.createElement('span', {}, useContext(Ctx));
    const App = () =>
      Reactisma.createElement(Ctx.Provider, { value: 'hello' }, Reactisma.createElement(Reader, {}));
    const { container } = render(App);
    expect(container.querySelector('span')!.textContent).toBe('hello');
  });
});
