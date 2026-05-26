# Module 5 — Manual tests for advanced hooks, Fragment, Error Boundaries

PR #6 adds `useLayoutEffect`, `useImperativeHandle`, `useId`, `useTransition`, `useDeferredValue`, `Fragment`, and `withErrorBoundary` to Reactisma.

## How to run

```bash
npm run dev
```

Each test requires a small temporary edit to `src/components/App.tsx` (or the file noted) — revert after testing.

---

## 1. `useLayoutEffect` runs before paint

**What it verifies:** `useLayoutEffect` drains synchronously after DOM mutations and before the regular `useEffect` queue. See [hooks/hooks.ts:useLayoutEffect](../../src/libs/Reactisma/hooks/hooks.ts) and [core/render.ts](../../src/libs/Reactisma/core/render.ts).

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { useState, useEffect, useLayoutEffect } = Reactisma;

const [n, setN] = useState(0);
useLayoutEffect(() => console.log('layout', n));
useEffect(() => console.log('effect', n));
<Button onClick={() => setN(n + 1)}>bump</Button>
```

**Steps:**

1. Reload. Console logs (in order): `layout 0`, `effect 0`.
2. Click **bump**. Console logs: `layout 1`, `effect 1`.

**Expected:** `layout` always precedes `effect` in the log order. With the old single-queue model, both would run interleaved by hook position.

---

## 2. `useImperativeHandle` exposes methods through a ref

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { useRef, useState, useImperativeHandle } = Reactisma;

type ChildAPI = { greet: () => string; reset: () => void };

const Child = ({ apiRef }: { apiRef: { current: ChildAPI | null } }) => {
  const [n, setN] = useState(0);
  useImperativeHandle(apiRef, () => ({
    greet: () => `hello from child, n=${n}`,
    reset: () => setN(0),
  }), [n]);
  return <span>{n}</span>;
};

// In App:
const apiRef = useRef<ChildAPI>(null);
<Child apiRef={apiRef} />
<Button onClick={() => console.log(apiRef.current?.greet())}>greet</Button>
```

**Steps:**

1. Reload. Click **greet** → console logs `hello from child, n=0`.
2. (Internally bump n with another button) → click **greet** → log reflects new n.

**Expected:** the API is rebuilt only when its deps (`n`) change.

---

## 3. `useId` is stable across renders, unique across components

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { useId, useState, useEffect } = Reactisma;

const Counter = () => {
  const id = useId();
  const [n, setN] = useState(0);
  useEffect(() => console.log(`Counter ${id} rendered with n=${n}`));
  return (
    <div>
      <label htmlFor={id}>n:</label>
      <input id={id} value={String(n)} onInput={(e) => setN(Number((e.target as HTMLInputElement).value))} />
    </div>
  );
};

// In App: render 3 instances:
<Counter /><Counter /><Counter />
```

**Steps:**

1. Reload. Console logs 3 distinct ids (e.g. `:r1:`, `:r2:`, `:r3:`).
2. Trigger several re-renders. The ids do NOT change.
3. Inspect any `<input>`: the `id` attribute matches the `for` attribute of its `<label>`.

**Expected:** id-label association survives reorders and re-renders.

---

## 4. `useTransition` keeps the input snappy under load

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { useState, useTransition } = Reactisma;

const [text, setText] = useState('');
const [list, setList] = useState<number[]>([]);
const [isPending, startTransition] = useTransition();

const onInput = (e: Event) => {
  const v = (e.target as HTMLInputElement).value;
  setText(v);
  startTransition(() => {
    // Heavy compute: 5000 derived items
    setList(Array.from({ length: 5000 }, (_, i) => i + v.length));
  });
};

<input value={text} onInput={onInput} />
<span>{isPending ? 'updating…' : 'idle'}</span>
<div>items: {list.length}</div>
```

**Steps:**

1. Type quickly into the input.

**Expected:**
- The input echoes each keystroke without lag.
- The `updating…` indicator flashes briefly during typing bursts.
- The `items:` count catches up after you stop typing.

---

## 5. `useDeferredValue` lags an expensive subtree

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { useState, useDeferredValue } = Reactisma;

const ExpensiveList = ({ query }: { query: string }) => {
  // Simulate cost
  const items = [];
  for (let i = 0; i < 5000; i++) items.push(`${query}-${i}`);
  return <div>{items.length} matches</div>;
};

const [query, setQuery] = useState('');
const deferred = useDeferredValue(query);

<input value={query} onInput={(e) => setQuery((e.target as HTMLInputElement).value)} />
<ExpensiveList query={deferred} />
```

**Steps:**

1. Type fast.

**Expected:** the input updates immediately; the `ExpensiveList` lags one tick behind without blocking the typing.

---

## 6. Fragment renders children with no layout box

**Setup (temporary):**

```tsx
const App = () => (
  <>
    <span>A</span>
    <span>B</span>
    <span>C</span>
  </>
);
```

**Steps:**

1. Reload.
2. Inspect the DOM tree.

**Expected:** there is ONE `<div data-fragment style="display: contents">` wrapping the three spans. Layout-wise the spans behave as if siblings of the parent (since `display: contents` removes the box).

**Limitation:** a true Fragment would produce no wrapper at all. This wrapper is invisible to layout but visible to selectors like `parent > *`. Fix planned with the iterative reconciler rewrite.

---

## 7. `withErrorBoundary` catches a render-time throw

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { withErrorBoundary, useState } = Reactisma;

const Buggy = ({ crash }: { crash: boolean }) => {
  if (crash) throw new Error('Intentional');
  return <span>OK</span>;
};

const Fallback = ({ error, reset }: { error: Error; reset: () => void }) => (
  <div>
    <p>caught: {error.message}</p>
    <Button onClick={reset}>retry</Button>
  </div>
);

const Safe = withErrorBoundary(Buggy, Fallback);

// In App:
const [c, setC] = useState(false);
<Button onClick={() => setC(!c)}>toggle crash</Button>
<Safe crash={c} />
```

**Steps:**

1. Reload. UI shows `OK`.
2. Click **toggle crash**. UI shows `caught: Intentional` + a `retry` button.
3. Click **retry**. UI shows `OK` again.

**Expected:** the error is contained, the rest of the app keeps working, and `reset` clears it.

**Limitation:** this boundary only catches errors thrown during the render of the wrapped component itself. Errors in nested descendants must be caught by their own boundary (or by the iterative reconciler rewrite, which can wrap `performUnitOfWork` in a try/catch).

---

## 8. Provider + transition interplay

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { createContext, useContext, useState, useTransition } = Reactisma;

const ThemeContext = createContext<'light' | 'dark'>('light');

const Themed = () => <span>{useContext(ThemeContext)}</span>;

const [theme, setTheme] = useState<'light' | 'dark'>('light');
const [, startTransition] = useTransition();

<Button onClick={() => startTransition(() => setTheme(theme === 'light' ? 'dark' : 'light'))}>
  toggle theme
</Button>
<ThemeContext.Provider value={theme}>
  <Themed />
</ThemeContext.Provider>
```

**Steps:**

1. Click. The `<Themed>` flips after the (low-priority) render is committed.

**Expected:** no provider-stack leak after many toggles. `Themed` always reads the latest committed theme; never a stale or undefined value.

---

## Known limitations summary

- Fragment uses a `display: contents` wrapper, not a true bare-multi-DOM-children construct.
- ErrorBoundary catches synchronous renders of the WRAPPED component only.
- `useId` ids are deterministic only if the SAME tree renders in the SAME order; cross-tree determinism (SSR ↔ client) lands in M11/PR #12.
