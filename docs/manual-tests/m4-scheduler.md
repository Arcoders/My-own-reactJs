# Module 4 — Manual tests for the priority scheduler

PR #5 introduces `src/libs/Reactisma/scheduler/` — a priority queue with `MessageChannel`-based time-slicing. `core/scheduler.ts` now routes every render through it.

## What this PR contains, what it does not

**In:**

- 4-tier priority model (Immediate, UserBlocking, Normal, Idle) with timeout-derived `expirationTime`.
- A binary-inserted sorted queue.
- A host loop driven by `MessageChannel` (with `setTimeout` fallback for non-browser environments).
- `shouldYield()` that returns `true` once the current 5 ms slice is consumed.
- `runWithPriority(priority, fn)` + `startTransition(fn)` to mark a chunk of work as non-urgent.

**Out (deferred to a follow-up):**

- Work-loop-by-fiber interruptibility. Today, a single render still walks the VNode tree synchronously inside one task; the new scheduler only slices BETWEEN root renders, not within them. The Fiber node skeleton lands when the reconciler is rewritten in iterative form.

## How to run

```bash
npm run dev
```

Tests below need the browser DevTools Performance tab and one temporary code edit in `src/components/App.tsx` per scenario.

---

## 1. Renders are batched into one scheduler task

**Setup (temporary, App.tsx):**

```tsx
const [a, setA] = useState(0);
const [b, setB] = useState(0);
const [c, setC] = useState(0);

const bumpAll = () => {
  setA(a + 1);
  setB(b + 1);
  setC(c + 1);
};

useEffect(() => {
  console.log('render', { a, b, c });
});

<Button onClick={bumpAll}>bump three</Button>
```

**Steps:**

1. Reload. Console logs once with `0, 0, 0`.
2. Click **bump three**.

**Expected:** the console logs ONCE with `1, 1, 1`, not three times. The scheduler's `pendingTask` guard collapses simultaneous `scheduleRender` calls into one task.

---

## 2. `startTransition` yields to user-blocking input

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { startTransition } = Reactisma;

const [text, setText] = useState('');
const [list, setList] = useState<number[]>([]);

const onInput = (e: Event) => {
  setText((e.target as HTMLInputElement).value);  // urgent (Normal)
  startTransition(() => {
    // Expensive: produce 5000 derived numbers as Idle priority
    const huge = Array.from({ length: 5000 }, (_, i) => i * Math.random());
    setList(huge);
  });
};

<input value={text} onInput={onInput} />
<div>{list.length} items</div>
```

**Steps:**

1. Reload. Type fast into the input.

**Expected:** input keystrokes feel responsive even though the `list` update is heavy. With `startTransition` the list update is enqueued as Idle priority; with a plain `setList` you would feel jank.

Open DevTools → Performance, record a few seconds while typing. The long tasks for `list` should be interleaved with short tasks for `text`.

---

## 3. `shouldYield()` exposes the slice deadline

**What it verifies:** inside a scheduled callback you can call `shouldYield()` to break a loop. Useful for any future work that wants to cooperate with the host.

**Setup (temporary, somewhere you can run code):**

```js
import { scheduleCallback, shouldYield, NormalPriority } from './libs/Reactisma/scheduler';

scheduleCallback(NormalPriority, () => {
  let i = 0;
  while (!shouldYield() && i < 1_000_000) i++;
  console.log('processed', i, 'iterations before yielding');
});
```

**Expected:** the log shows somewhere in the order of 10^4–10^5 iterations (5 ms of work on a modern laptop). Re-run several times — the number varies with CPU load.

---

## 4. Cancelled tasks do not run

**Setup (temporary):**

```js
import { scheduleCallback, cancelTask, NormalPriority } from './libs/Reactisma/scheduler';

const t = scheduleCallback(NormalPriority, () => console.log('SHOULD NOT RUN'));
cancelTask(t);
```

**Expected:** the console stays silent. The flushWork loop checks the `cancelled` flag and skips the task.

---

## 5. Expired tasks run even if `shouldYield()` would say "yield"

**What it verifies:** an Immediate or UserBlocking task whose `expirationTime` has passed must run to completion, otherwise it would never get the chance to run on a busy page.

**Setup (temporary):**

```js
import { scheduleCallback, ImmediatePriority, NormalPriority } from './libs/Reactisma/scheduler';

scheduleCallback(NormalPriority, () => {
  // Heavy work to consume the slice
  const stop = performance.now() + 50;
  while (performance.now() < stop) {}
  console.log('heavy normal done');
});

scheduleCallback(ImmediatePriority, () => {
  console.log('immediate ran');
});
```

**Expected:** the second log appears immediately after the first (in the next host tick). The Immediate task was added AFTER but its `expirationTime` is in the past, so when the queue gets to it, `isExpired === true` and it runs through `shouldYield()`.

---

## 6. Render priority honors the surrounding `runWithPriority`

**Setup (temporary):**

```tsx
import Reactisma from '../libs/Reactisma';
const { runWithPriority, useState, useEffect } = Reactisma;
import { IdlePriority } from '../libs/Reactisma/scheduler';

const [n, setN] = useState(0);
useEffect(() => console.log('rendered', n));

const idleBump = () => runWithPriority(IdlePriority, () => setN((x) => x + 1));
<Button onClick={idleBump}>idle bump</Button>
```

**Steps:**

1. Click **idle bump**.

**Expected:** the render still happens (microseconds-to-milliseconds later depending on browser load). If you put an artificial heavy task at Normal priority before clicking, the idle bump will visibly wait for the normal task to finish.

---

## 7. Pending render is collapsed across hooks

**Setup (temporary):**

```tsx
const [x, setX] = useState(0);
useEffect(() => {
  // Trigger another render inside an effect — synchronously this time
  if (x === 0) setX(1);
}, [x]);
```

**Expected:** no infinite loop, no double-render storm. The second `setX(1)` is collapsed by the `pendingTask` guard until the current commit finishes. After that, exactly one re-render runs with `x === 1`, the effect runs, sees `x !== 0`, and the loop terminates.

---

## Performance check (informal)

In the DevTools console:

```js
performance.mark('start');
for (let i = 0; i < 1000; i++) {
  // Force a render
  document.querySelector('canvas')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}
performance.mark('end');
performance.measure('1000 paints', 'start', 'end');
performance.getEntriesByName('1000 paints')[0].duration;
```

Compare the duration before and after this PR. Expect a small win (~5-15%) because the new scheduler avoids `Promise.resolve()` allocation per update and consolidates dispatches.

---

## Known limitation

The work inside one render is still synchronous. A 50 ms diff of a 10k-node tree will still block the main thread for 50 ms in this PR. The `shouldYield`/`MessageChannel` plumbing is in place; wiring it into a fiber-style `performUnitOfWork` is a follow-up that requires rewriting `diff.ts` and `mount-element.ts` from recursion to an iterative walker. The course module covers the design in detail; the iterative rewrite is the homework / next PR.
