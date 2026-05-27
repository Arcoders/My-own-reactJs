# Module 2 — Manual tests for keyed reconciliation

These tests verify the keyed-children algorithm introduced in PR #3 (`src/libs/Reactisma/core/diff.ts`). Automated coverage lands in M9/PR #10.

## How to run

```bash
npm run dev
```

Open the app, then DevTools. Many of these tests require a tiny temporary code change to reproduce the scenario — instructions are inline.

---

## 1. Keys preserve component instances on reorder

**What it verifies:** when a list is reordered, identical `key`s reuse the existing instance instead of recreating it. See [reconcileByKey in diff.ts](../../src/libs/Reactisma/core/diff.ts).

**Setup (temporary):**

In [src/components/DigitSelector.tsx](../../src/components/DigitSelector.tsx), make each `DigitButton` keyed:

```tsx
{digits.map((d) => (
  <DigitButton key={d} selected={d === selectedDigit} onClick={() => onSelectDigit(d)}>
    {d}
  </DigitButton>
))}
```

In `src/components/App.tsx`, store `digits` in state and add a button to reverse:

```tsx
const [digits, setDigits] = useState(() => [0,1,2,3,4,5,6,7,8,9]);
// ...somewhere visible:
<Button onClick={() => setDigits([...digits].reverse())}>reverse</Button>
```

**Steps:**

1. Open DevTools → Elements. Expand the `DigitButtons` container.
2. Right-click the button for digit `0` → "Store as global variable" → `temp1`.
3. Click **reverse**.
4. In Console: `temp1.textContent`.

**Expected:**
- The DOM node `temp1` still exists (was moved, not recreated).
- `temp1.textContent === '0'`.
- All ten buttons are now in reverse order in the DOM.

Without keys (or with `key={index}`), `temp1` would have its text replaced with `9` because the reconciler reuses by position.

---

## 2. Focus is preserved across reorder

**Steps (continues from test 1):**

1. Click an empty area to lose focus, then `Tab` into the buttons. The digit `0` is focused (visible outline).
2. Click **reverse**.

**Expected:** the button for digit `0` is still focused (it just moved to the end of the row, focus rings travels with the element).

With index-based reconciliation, focus would stay on the **first** DOM node (now digit `9`), which is wrong.

---

## 3. New element inserted in the middle does not re-mount the rest

**Setup (temporary):**

In `App.tsx`:

```tsx
const [digits, setDigits] = useState(() => [0,1,2,3,4,5,6,7,8,9]);
// Insert "10" between 4 and 5:
<Button onClick={() => setDigits([0,1,2,3,4,10,5,6,7,8,9])}>insert 10</Button>
```

**Steps:**

1. Note the DOM node of digit `5` (store as `$0` via DevTools).
2. Click **insert 10**.

**Expected:** the DOM node of digit `5` is the SAME instance (still `$0`). Only one new node was inserted before it. Without keys, every node from index 5 onwards is "rewritten in place".

---

## 4. Removed key triggers unmount and effect cleanup

**Setup (temporary):**

Add a child component with a logged effect:

```tsx
const Beep = ({ id }: { id: number }) => {
  useEffect(() => {
    console.log('mount', id);
    return () => console.log('unmount', id);
  }, []);
  return <span>{id}</span>;
};
```

In `App.tsx`:

```tsx
const [ids, setIds] = useState(() => [1, 2, 3]);
<div>{ids.map((id) => <Beep key={id} id={id} />)}</div>
<Button onClick={() => setIds(ids.filter((x) => x !== 2))}>remove 2</Button>
```

**Steps:**

1. Reload. Console shows `mount 1`, `mount 2`, `mount 3`.
2. Click **remove 2**.

**Expected:** Console shows `unmount 2` (and nothing else). With index-based reconciliation, you would see `unmount 3` (the last one) plus a state corruption because the surviving instances would have been shuffled.

---

## 5. Mixed keyed + unkeyed children

**What it verifies:** the reconciler handles a list with some keyed and some unkeyed siblings without confusion. Unkeyed siblings are matched positionally among themselves.

**Setup (temporary):**

```tsx
<div>
  <span key="a">A</span>
  <span>plain1</span>
  <span key="b">B</span>
  <span>plain2</span>
</div>
```

Reorder to `b, plain1, a, plain2` and re-render.

**Expected:** the keyed `A` and `B` swap positions; the two unkeyed `<span>`s reuse the existing DOM nodes in order. No crashes, no double-mount.

---

## 6. Same component type, different keys → different instances

**Setup (temporary):**

```tsx
const Counter = () => {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
};

// In App:
const [keyVal, setKeyVal] = useState('A');
<Counter key={keyVal} />
<Button onClick={() => setKeyVal(keyVal === 'A' ? 'B' : 'A')}>swap key</Button>
```

**Steps:**

1. Click the counter 3 times. It says `3`.
2. Click **swap key**.

**Expected:** the counter resets to `0`. Different `key` means a new instance.

Without the keyed path, since `type` is unchanged, the same instance would be reused and the counter would stay at `3`.

---

## 7. No keys → falls back to index reconciliation (existing behavior preserved)

**Steps:**

1. Do nothing special. The current `App.tsx` does not use keys.
2. Click around the app: draw, predict, train, change selected digit.

**Expected:** everything still works as before. No console errors. The non-keyed fallback path is the original index-based behavior.

---

## 8. `__$virtualDOM` is updated on every render

**Steps:**

1. Inspect any element in DevTools.
2. In Console: `$0.__$virtualDOM`.
3. Trigger a re-render (e.g. draw on canvas).
4. Run `$0.__$virtualDOM` again.

**Expected:** the object reference may change (new VNode each render) but `type`, `props`, and (when applicable) `key` are coherent with the latest render.

---

## Known limitation (deferred to M4)

A DOM node carries only ONE `__$componentInstance` reference. When components nest (e.g. `<A><B>div</B></A>`), only the innermost instance is tracked at the boundary node. Cleanup of outer hooks works because each component is rooted at the same DOM node and `runCleanupEffects` is called on the visible instance, but if outer and inner instances both register effects, only the inner cleanup runs reliably on unmount.

A real Fiber-like architecture (M4 / PR #5) replaces this with an explicit component tree where every level has its own list of hooks.
