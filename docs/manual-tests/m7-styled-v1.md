# Module 7 — Manual tests for StyledComponent v1

PR #8 replaces the textContent-append registry with a real parser + `CSSStyleSheet.insertRule()` + refcount. Nested selectors (`&:hover`, `&::before`, `& > .child`) and `@media` / `@supports` / `@keyframes` are now expanded correctly.

## How to run

```bash
npm run dev
```

Open DevTools → Sources → expand `head` to inspect the `<style data-styled="reactisma">` element. Most tests inspect its `sheet.cssRules`.

---

## 1. Static styles produce one rule per declaration block

**Steps:**

1. Reload the app.
2. In Console:
   ```js
   const sheet = document.querySelector('style[data-styled=reactisma]').sheet;
   Array.from(sheet.cssRules).map(r => r.cssText).slice(0, 5);
   ```

**Expected:** the first few entries are well-formed `.rsx-<hash> { ... }` rules. The previous implementation produced a single giant `textContent` blob; now you can iterate them.

---

## 2. `&:hover` is correctly expanded

**Steps:**

1. In Console:
   ```js
   const sheet = document.querySelector('style[data-styled=reactisma]').sheet;
   const hoverRules = Array.from(sheet.cssRules)
     .map(r => r.cssText)
     .filter(t => t.includes(':hover'));
   console.log(hoverRules);
   ```

**Expected:** you see rules like `.rsx-<hash>:hover { background: ... }`. The `&` has been replaced with `.<className>`.

Hover the `Predict` button. Visual feedback (lighter background, scaled inward) appears.

---

## 3. `&::-webkit-slider-thumb` survives the parser

**Steps:**

1. Inspect the memory-influence slider.
2. In Console:
   ```js
   const sheet = document.querySelector('style[data-styled=reactisma]').sheet;
   Array.from(sheet.cssRules)
     .map(r => r.cssText)
     .filter(t => t.includes('-webkit-slider-thumb'));
   ```

**Expected:** at least one rule of the form `.rsx-<hash>::-webkit-slider-thumb { ... }`. The slider thumb has the round white look (white circle with shadow), confirming the styles took effect.

---

## 4. Refcount: identical CSS is registered once

**Setup (temporary, App.tsx):**

```tsx
const Box = styled.div`
  color: red;
  background: white;
`;
// Render 5 of them:
<><Box>a</Box><Box>b</Box><Box>c</Box><Box>d</Box><Box>e</Box></>
```

**Steps:**

1. Reload.
2. In Console:
   ```js
   import('/src/libs/StyledComponent/registry.ts').then(m => console.log(m._peekStyles()));
   ```

**Expected:** ONE entry for the `color: red; background: white;` chunk, with `refcount: 5`. Without refcount, you'd see five identical entries and five rules in the sheet.

---

## 5. Refcount: unmounting decrements

**Steps (continues from test 4):**

1. Temporarily wrap the 5 boxes in `{visible && <>...</>}` and toggle `visible`.
2. Watch `_peekStyles()` after unmount.

**Expected:** when `visible` flips to false, the entry disappears entirely (refcount went 5 → 4 → 3 → 2 → 1 → 0 → delete). Re-toggling visible brings the entry back at refcount 5.

---

## 6. `@media` wraps the base selector

**Setup (temporary):**

```tsx
const Responsive = styled.div`
  color: red;
  @media (min-width: 800px) {
    color: blue;
  }
`;
```

**Steps:**

1. Reload. Resize the window across 800 px.

**Expected:** color flips from red → blue when the window exceeds 800 px. In Console, the generated rule should be `@media (min-width: 800px) { .rsx-<hash> { color: blue; } }`.

---

## 7. Multi-selector comma list

**Setup (temporary):**

```tsx
const Btn = styled.button`
  background: white;
  &:hover, &:focus {
    background: #eee;
  }
`;
```

**Expected:** generated rule reads `.rsx-X:hover, .rsx-X:focus { background: #eee; }`. Both states apply the same style. Tab onto the button → background lightens; hover → background lightens.

---

## 8. Dynamic interpolation generates a new class per unique output

**Setup (temporary):**

```tsx
const Highlight = styled.div<{ selected?: boolean }>`
  background: ${(p) => (p.selected ? 'gold' : 'transparent')};
`;
const [sel, setSel] = useState(false);
<Highlight selected={sel}>x</Highlight>
<Button onClick={() => setSel(!sel)}>toggle</Button>
```

**Steps:**

1. Reload. Toggle several times.
2. `_peekStyles()` shows two entries (one for `gold`, one for `transparent`) with refcount 1 each (whichever is active).

**Expected:** when you toggle, the unused class is released (refcount → 0 → removed from sheet); the active one is at refcount 1.

---

## 9. Invalid CSS does not crash the registry

**Setup (temporary):**

```tsx
const Broken = styled.div`
  not-valid !!{}
`;
```

**Expected:** Console shows `[styled] invalid CSS rule skipped: ...` but the rest of the app keeps working. The cache entry exists with an empty `ruleIndices` array.

---

## 10. The existing styles in `src/styles/styled.ts` keep working

**Steps:**

1. Reload the unmodified app.
2. Visually compare against the previous version (glass-morphic Card, blue PrimaryButton, rounded DigitButtons, slider thumb).

**Expected:** identical visuals. The parser correctly handles every CSS pattern used by the demo (gradient backgrounds, backdrop filters, nested `&:hover` / `&:focus`, vendor-prefixed pseudo-elements like `&::-webkit-slider-thumb`).

---

## Known limitations

- **One level of nesting** only. `&:hover { &:focus { ... } }` works but anything deeper than two levels needs to be flattened by hand.
- **No CSS variables substitution.** `${theme.colors.primary}` works via the interpolation function path; `var(--primary)` is preserved verbatim into the rule (no fallback resolution).
- **Atomic CSS (one rule per declaration) lands in PR #9 (M8).** Currently each unique declaration block is one rule, so identical declarations across different components don't dedupe.
- **`ThemeProvider` lands in PR #9.** Today, `setTheme(theme)` is a global setter — fine for the demo, not enough for nested themes.
