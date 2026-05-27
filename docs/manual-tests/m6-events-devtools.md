# Module 6 — Manual tests for synthetic events, batching, DevTools

PR #7 introduces:
- A single delegated listener per `(root, eventType)` instead of per-element `addEventListener` ([events/delegation.ts](../../src/libs/Reactisma/events/delegation.ts)).
- `SyntheticEvent` wrapper that normalizes `currentTarget`, has its own `stopPropagation`, and forwards `preventDefault` to the native event ([events/synthetic-event.ts](../../src/libs/Reactisma/events/synthetic-event.ts)).
- `<Reactisma.DevTools />` — a sidebar that prints the live component tree, hooks summary, and props.

## How to run

```bash
npm run dev
```

---

## 1. One listener per event type per root

**Steps:**

1. Open the running app. Inspect the `#root` element in DevTools.
2. Right-click → "Store as global" → `$root`.
3. In console: `getEventListeners($root)`.

**Expected:** the list contains one entry per delegated event type (`click`, `mousedown`, `keydown`, etc.). It does NOT grow as you draw, click around, or train the network.

Compare with: before PR #7, each `<Button>` and `<DigitButton>` carried its own `click` listener — that grows with the number of buttons.

---

## 2. `currentTarget` follows the bubble path

**Setup (temporary, App.tsx):**

```tsx
<div onClick={(e) => console.log('outer currentTarget:', (e.currentTarget as Element).tagName)}>
  <div onClick={(e) => console.log('inner currentTarget:', (e.currentTarget as Element).tagName)}>
    <span>click me</span>
  </div>
</div>
```

**Steps:**

1. Click the span.

**Expected:** logs (in order) `inner currentTarget: DIV`, then `outer currentTarget: DIV`. With raw native events, both logs would show the same value (the target the listener was attached to), but our synthetic dispatcher rewrites `currentTarget` on every step of the bubble path.

---

## 3. `stopPropagation` interrupts the bubble

**Setup (temporary):**

```tsx
<div onClick={() => console.log('OUTER ran')}>
  <button onClick={(e) => { console.log('INNER ran'); e.stopPropagation(); }}>
    stop here
  </button>
</div>
```

**Steps:**

1. Click `stop here`.

**Expected:** only `INNER ran` appears. The outer handler is skipped because the synthetic event's propagation flag short-circuits the inner loop.

---

## 4. `preventDefault` reaches the native event

**Setup (temporary):**

```tsx
<a href="https://example.com" onClick={(e) => { e.preventDefault(); console.log('blocked'); }}>
  example
</a>
```

**Steps:**

1. Click the link.

**Expected:** the page does NOT navigate; console logs `blocked`. The synthetic `preventDefault` delegates to the native event so the browser respects it.

---

## 5. Batching: multiple setState collapse into one render

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { useState, useEffect } = Reactisma;

const [a, setA] = useState(0);
const [b, setB] = useState(0);
const [c, setC] = useState(0);
useEffect(() => console.log('render', a, b, c));

<Button onClick={() => { setA(a + 1); setB(b + 1); setC(c + 1); }}>bump all</Button>
```

**Steps:**

1. Click `bump all`.

**Expected:** console logs ONCE with `1 1 1`. The delegated dispatcher wraps the handler with `startBatching()` / `endBatching()`. The scheduler's `pendingTask` guard absorbs the three `scheduleRender` calls into one task.

---

## 6. Handlers that throw don't break the dispatcher

**Setup (temporary):**

```tsx
<div onClick={() => { throw new Error('boom'); }}>throw on click</div>
<Button onClick={() => console.log('after')}>after</Button>
```

**Steps:**

1. Click the throwing div.
2. Click `after`.

**Expected:** the console shows `[reactisma] handler threw: Error: boom` for the first click, then `after` for the second. The dispatcher catches and logs; subsequent clicks keep working.

---

## 7. DevTools sidebar shows the live tree

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { DevTools } = Reactisma;

// At the end of App's JSX:
<DevTools />
```

**Steps:**

1. Reload. A "devtools" pill appears in the bottom-right.
2. Click it. A sidebar opens listing the component tree (root `App`, children with names, hook counts, prop previews).
3. Click `reset brain`. The tree refreshes (every 500 ms) to reflect the new state.
4. Close with the `close` button.

**Expected:** every named component appears with `#uid`, `N hooks` summary, and a short props preview. The display updates as the app re-renders.

**Limitation:** the inspector polls every 500 ms instead of subscribing to commits — a follow-up will publish commit events.

---

## 8. Touch events with passive: false work for canvas drawing

**Steps:**

1. On a touch device (or DevTools "Toggle device toolbar" → touch simulator), draw on the canvas.

**Expected:** drawing works smoothly, no console warning about non-passive listeners. The delegation system registers all touch types with `passive: false` precisely so `preventDefault` is honored on canvas/touch interactions.

---

## Known limitations

- **No native scroll/load/error delegation.** Events that don't bubble (`scroll`, `load`, `error`, etc.) require capturing or per-element listeners; not delegated here.
- **`useDrawing` still uses native `addEventListener`** for its low-level pen tracking. That works alongside the synthetic system — the two systems do not interfere.
- **The DevTools tree is read-only** (no prop editing). Read/write Inspector is in the roadmap for M9+ once Vitest can verify the API.
