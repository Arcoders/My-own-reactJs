# Module 3 — Manual tests for advanced hooks

PR #4 adds `useReducer`, `useMemo`, `useContext` + `createContext`, `useDeepCompareEffect` to Reactisma, plus an `Object.is` bailout in `useState`. Automated coverage lands in M9/PR #10.

## How to run

```bash
npm run dev
```

Open the app and follow the steps. Most tests need a small temporary code change in `src/components/App.tsx`. Revert each block after testing.

---

## 1. `useState` bailout with `Object.is`

**What it verifies:** setting the same value twice does not trigger a re-render. See [hooks/hooks.ts:useState](../../src/libs/Reactisma/hooks/hooks.ts).

**Setup (temporary, in `App.tsx`):**

```tsx
const [n, setN] = useState(0);
useEffect(() => {
  console.log('App rendered, n =', n);
});
<Button onClick={() => setN(0)}>set 0</Button>
```

**Steps:**

1. Reload. Console logs `App rendered, n = 0`.
2. Click **set 0** ten times.

**Expected:** the log does NOT repeat. With `!==`, `NaN !== NaN` would be true and would have caused spurious re-renders for `NaN` state. With `Object.is(NaN, NaN) === true`, the bailout is correct.

Now try `setN((x) => x)` (returning the same reference). Same result: no re-render.

---

## 2. `useReducer` discriminated actions

**Setup (temporary):**

```tsx
type CounterAction = { type: 'inc' } | { type: 'dec' } | { type: 'reset'; payload: number };
const counterReducer = (state: number, action: CounterAction): number => {
  switch (action.type) {
    case 'inc': return state + 1;
    case 'dec': return state - 1;
    case 'reset': return action.payload;
  }
};
const [count, dispatch] = useReducer(counterReducer, 0);
// In the JSX:
<div>
  <Button onClick={() => dispatch({ type: 'inc' })}>+1</Button>
  <Button onClick={() => dispatch({ type: 'dec' })}>-1</Button>
  <Button onClick={() => dispatch({ type: 'reset', payload: 100 })}>reset</Button>
  <span>{count}</span>
</div>
```

**Steps:**

1. Click `+1` five times → `5`.
2. Click `-1` twice → `3`.
3. Click `reset` → `100`.

**Expected:** the counter updates correctly. TS should error if you forget a case (`reset` requires payload).

**Lazy init test:**

```tsx
const [count, dispatch] = useReducer(counterReducer, 0, (i) => i + 1000);
```

Reload. Initial `count === 1001` (init function was called once).

---

## 3. `useMemo` recomputes only when deps change

**Setup (temporary):**

```tsx
const [n, setN] = useState(0);
const [other, setOther] = useState('');
const expensive = useMemo(() => {
  console.log('recomputing for n =', n);
  return n * n;
}, [n]);
<div>
  <input value={other} onInput={(e) => setOther((e.target as HTMLInputElement).value)} />
  <Button onClick={() => setN(n + 1)}>n+1 (now {n})</Button>
  <span>square: {expensive}</span>
</div>
```

**Steps:**

1. Type in the input. Console does NOT log "recomputing".
2. Click `n+1`. Console logs once per click.

**Expected:** the factory runs only when `n` changes, not on every render triggered by `other`.

---

## 4. `useContext` reads the nearest Provider

**Setup (temporary):**

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light');

const Themed = () => {
  const theme = useContext(ThemeContext);
  return <span>theme is {theme}</span>;
};

const App = () => {
  const [t, setT] = useState<'light' | 'dark'>('light');
  return (
    <ThemeContext.Provider value={t}>
      <Button onClick={() => setT(t === 'light' ? 'dark' : 'light')}>toggle</Button>
      <Themed />
    </ThemeContext.Provider>
  );
};
```

**Steps:**

1. Reload. The span reads "theme is light".
2. Click `toggle`. Span reads "theme is dark".

**Expected:** `Themed` re-renders with the new value as the Provider's `value` changes.

**Nested providers:**

```tsx
<ThemeContext.Provider value="light">
  <Themed />
  <ThemeContext.Provider value="dark">
    <Themed />
  </ThemeContext.Provider>
</ThemeContext.Provider>
```

Reload. First `Themed` reads `light`, second reads `dark`. (Static example; if you toggle the outer, only the first changes.)

**Default value:**

`<Themed />` outside any Provider reads `'light'` (the default passed to `createContext`).

---

## 5. `useDeepCompareEffect` does not re-fire on identity-only changes

**Setup (temporary):**

```tsx
const [tick, setTick] = useState(0);
// Recreated on every render → reference changes:
const options = { window: 28, channels: 3 };
useDeepCompareEffect(() => {
  console.log('options effect ran');
}, [options]);
<Button onClick={() => setTick(tick + 1)}>tick: {tick}</Button>
```

**Steps:**

1. Reload. Console logs `options effect ran` once.
2. Click `tick` 5 times.

**Expected:** the log does NOT repeat. `useEffect(fn, [options])` would re-fire 5 times because `options` is a fresh object each render. `useDeepCompareEffect` compares by structure.

Now modify a key:

```tsx
const options = { window: 28 + (tick % 3), channels: 3 };
```

Reload, click 4 times. Effect fires when `window` actually changes value.

---

## 6. Provider stack push/pop balance

**What it verifies:** the provider stack returns to its pre-render state after a re-render. A leak would manifest as `useContext` returning stale values after enough renders.

**Setup (temporary):**

```tsx
const Probe = () => {
  const v = useContext(ThemeContext);
  useEffect(() => console.log('probe sees', v));
  return null;
};
// In App, render <Probe /> OUTSIDE any provider, plus an inner case under
// the provider, and trigger 100 re-renders of the App.
```

**Steps:**

1. Click any state-changing button rapidly (e.g. **toggle** above) 50 times.
2. Render a `<Probe />` outside the provider.

**Expected:** the outside probe always logs `'light'` (the default), never a leaked value from the provider. The pop runs after each provider subtree, regardless of how many times the tree was reconciled.

---

## 7. `useReducer` integrates with re-render bailout

**Setup (temporary):**

```tsx
const noopReducer = (state: number, _action: 'noop'): number => state;
const [n, dispatch] = useReducer(noopReducer, 0);
useEffect(() => console.log('rerender'));
<Button onClick={() => dispatch('noop')}>noop</Button>
```

**Steps:**

1. Reload. Console logs `rerender` once.
2. Click `noop` 10 times.

**Expected:** the log does NOT repeat. The reducer returns the same state, the `Object.is` bailout inside `setState` skips the re-render.

---

## Known limitation

A DOM node still carries only ONE `__$componentInstance`. When `Provider` wraps a child, the child's instance overwrites the Provider's instance reference at the same DOM node. Cleanup of effects registered INSIDE the Provider component (rare) is not guaranteed. The Fiber-like architecture in M4 / PR #5 resolves this.
