# Module 1 — Manual tests for the DOM prop dispatcher

These tests verify the behavior of the typed prop dispatcher introduced in PR #2 (`src/libs/Reactisma/dom/`). Automated coverage lands in M9/PR #10 (Vitest). Until then, run these by hand in the browser.

## How to run

```bash
npm run dev
```

Open the app in the browser, then open DevTools. For each section below, follow the steps and check the result. When a step references a file, click the link to inspect the implementation.

---

## 1. Event listener swap does not leak

**What it verifies:** removing the previous listener BEFORE adding the new one prevents double-firing across renders. See [src/libs/Reactisma/dom/handlers/event.ts](../../src/libs/Reactisma/dom/handlers/event.ts).

**Steps:**

1. Open DevTools → Performance Monitor (or `chrome://devtools` → Memory).
2. Click the **Predict** button 50 times.
3. Open DevTools → Elements, select the `Predict` button.
4. In Console, run: `getEventListeners($0)`.

**Expected:** `click` listeners count is exactly 1. Before the dispatcher, every render added a new listener (leak).

---

## 2. Event removed on prop deletion

**What it verifies:** `eventHandler.cleanup` removes the listener when the prop disappears entirely.

**Steps (white-box):**

1. In `src/components/App.tsx`, temporarily wrap the `<Button onClick={clearMainCanvas}>` so that after 3 clicks the `onClick` becomes `undefined`.
2. Reload the page.
3. Click 4 times.

**Expected:** click #4 does nothing (listener was cleaned up after the prop disappeared). Revert the change after testing.

---

## 3. Boolean attributes round-trip

**What it verifies:** `attributeHandler` correctly handles `true`, `false`, `null`.

**Steps:**

1. Open the Inspector and select the **Predict** button.
2. In Console, run:
   ```js
   $0.hasAttribute('disabled')  // false initially
   ```
3. In a component, set `<Button disabled={true}>` and re-render.

**Expected:** the button gains `disabled=""` (empty attribute, native semantics). Setting `disabled={false}` removes the attribute entirely.

---

## 4. `ref` callback and ref object are both called

**What it verifies:** [src/libs/Reactisma/dom/handlers/ref.ts](../../src/libs/Reactisma/dom/handlers/ref.ts).

**Steps (white-box):**

1. In `src/components/App.tsx`, add:
   ```tsx
   <div ref={(el) => console.log('ref callback called with', el)}>hi</div>
   ```
2. Reload.

**Expected:** Console logs the actual DOM node on mount, then `null` on unmount (e.g. when `reset brain` is clicked).

Repeat with a ref object:
```tsx
const r = useRef<HTMLDivElement>(null);
<div ref={r}>hi</div>
// After mount, r.current is the div.
// After unmount, r.current becomes null.
```

---

## 5. Style object updates only changed properties

**What it verifies:** [src/libs/Reactisma/dom/handlers/style.ts](../../src/libs/Reactisma/dom/handlers/style.ts) calls `setProperty` only for keys present in the new value, and `removeProperty` for keys dropped.

**Steps (white-box):**

1. In a component, render `<div style={{ color: 'red', background: 'blue' }}>x</div>`.
2. Re-render with `style={{ color: 'red' }}`.
3. Inspect the element.

**Expected:** `color: red` persists, `background` is removed. No `style=""` left behind.

Test camelCase conversion: `style={{ backgroundColor: 'green' }}` should produce `background-color: green` in the DOM.

---

## 6. `className` swaps cleanly

**Steps:**

1. Render `<div className="a">x</div>`, then re-render with `className="b"`.
2. Inspect.

**Expected:** the `class` attribute is exactly `"b"` (not `"a b"`).

Setting `className=""` should remove the `class` attribute entirely.

---

## 7. Controlled inputs round-trip

**What it verifies:** [src/libs/Reactisma/dom/handlers/input.ts](../../src/libs/Reactisma/dom/handlers/input.ts) assigns to `el.value` (DOM property), not `setAttribute('value', ...)`.

**Steps:**

1. Use the SliderInput in the Memory Controls section.
2. Drag it. The display should update.
3. Check in Console: `document.querySelector('input[type="range"]').value` matches the slider position.

**Expected:** the value is read back from the DOM property, not from the attribute (which would be stale).

---

## 8. `dangerouslySetInnerHTML` is honored

**Steps (white-box):**

1. In a component, render:
   ```tsx
   <div dangerouslySetInnerHTML={{ __html: '<strong>hi</strong>' }} />
   ```
2. Inspect.

**Expected:** the div contains a real `<strong>` element, not the escaped text.

Then re-render the same component without the prop. The innerHTML should be cleared.

---

## 9. `$show` toggles display without sticky `display: none`

**What it verifies:** [src/libs/Reactisma/dom/handlers/show.ts](../../src/libs/Reactisma/dom/handlers/show.ts).

**Steps (white-box):**

1. Render `<div $show={true}>x</div>`, inspect → no `display` style.
2. Re-render with `$show={false}` → `display: none`.
3. Re-render with `$show={true}` → `display` removed (not `display: inline` or any default).
4. Remove the `$show` prop entirely → `display` is removed via cleanup.

---

## 10. Reserved props are not written to the DOM

**Steps:**

1. Render `<div children={['x']} textContent="hello" key="k">y</div>`.
2. Inspect.

**Expected:** no `children`, `textContent`, or `key` attribute appears on the DOM element. (`textContent` is consumed by `mountElement` for text nodes; `key` will be consumed by the keyed reconciler in M2/PR #3.)

---

## Performance check (informal)

In Console:

```js
const div = document.createElement('div');
const { updateDOM } = await import('/src/libs/Reactisma/dom/index.ts');
console.time('updateDOM x10000');
for (let i = 0; i < 10000; i++) {
  updateDOM(div, { props: { className: `c-${i}`, id: `i-${i}`, onClick: () => i } } as any);
}
console.timeEnd('updateDOM x10000');
```

**Target:** under 200 ms on a modern laptop. The previous pipeline implementation was 3-5x slower due to the middleware allocation per call.

---

## After M9 (PR #10)

Every test above will be ported to a Vitest spec under `src/libs/Reactisma/dom/__tests__/`. Until then, run these on every PR that touches `src/libs/Reactisma/dom/`.
