# Module 8 — Manual tests for StyledComponent v2

PR #9 adds `ThemeProvider`, `useTheme`, `keyframes`, `createGlobalStyle`, and `css`. The theme is now read from React context (via Reactisma's `createContext`) instead of a global setter.

## How to run

```bash
npm run dev
```

---

## 1. `ThemeProvider` propagates the theme

**Setup (temporary, App.tsx):**

```tsx
import styled, { ThemeProvider } from '../libs/StyledComponent';
import Reactisma from '../libs/Reactisma';
const { useState } = Reactisma;

const Badge = styled.span<{ tone?: string }>`
  background: ${(p) => (p.theme as { brand?: string }).brand ?? 'gray'};
  color: white;
  padding: 2px 10px;
  border-radius: 9999px;
`;

const [tone, setTone] = useState<'brand' | 'accent'>('brand');

<ThemeProvider value={{ brand: tone === 'brand' ? '#0066cc' : '#cc0066' }}>
  <Badge>{tone}</Badge>
</ThemeProvider>
<Button onClick={() => setTone(tone === 'brand' ? 'accent' : 'brand')}>swap tone</Button>
```

**Expected:** clicking `swap tone` flips the badge color. The theme reaches the styled component through context, no global setter required.

---

## 2. Nested `ThemeProvider` wins inside its subtree

**Setup (temporary):**

```tsx
<ThemeProvider value={{ brand: 'blue' }}>
  <Badge>outer</Badge>
  <ThemeProvider value={{ brand: 'red' }}>
    <Badge>inner</Badge>
  </ThemeProvider>
</ThemeProvider>
```

**Expected:** outer badge is blue, inner is red. The provider stack from PR #4 supports nesting transparently.

---

## 3. `keyframes` registers a named animation

**Setup (temporary):**

```tsx
import styled, { keyframes } from '../libs/StyledComponent';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0,0,0,0.1);
  border-top-color: #0066cc;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;
```

**Expected:** the spinner rotates. In DevTools sheet, you'll see `@keyframes kf-1 { ... }` and a separate `.rsx-X { animation: kf-1 1s linear infinite }`.

---

## 4. `createGlobalStyle` injects unscoped rules

**Setup (temporary):**

```tsx
import { createGlobalStyle } from '../libs/StyledComponent';
const GlobalReset = createGlobalStyle`
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; }
`;

// In App:
<GlobalReset />
```

**Expected:** the styles apply globally. Inspect the stylesheet — the selectors `*` and `body` appear without the `.rsx-...` prefix.

Unmount `GlobalReset` (e.g. with a conditional render). The rules are released.

---

## 5. `css` composes fragments

**Setup (temporary):**

```tsx
import styled, { css } from '../libs/StyledComponent';
const flex = css`display: flex; align-items: center; gap: 8px;`;
const elevated = css`box-shadow: 0 4px 12px rgba(0,0,0,0.1);`;
const Card = styled.div`
  ${flex}
  ${elevated}
  padding: 16px;
  background: white;
`;
```

**Expected:** the card layouts as a flex row with the shadow. Each fragment is inlined into the cssString.

---

## 6. App's existing styles still work without theme

**Steps:**

1. Reload the unmodified app (no ThemeProvider wrapping).

**Expected:** every previously working style still applies. Default theme is `{}` (the `createContext` default). Components reading `theme.brand` get `undefined`, which combined with fallback values (`?? 'gray'`) yields the same visual as before.

---

## What lands later

- **Atomic CSS opt-in (dedup by declaration)** — designed but not implemented. The current path is "one className per cssString", same as styled-components v6.
- **`as` prop (polymorphic tag)** — requires generic-aware typing across the entire `styled` factory; lands when the rewrite of `src/styles/styled.ts` happens in M9.
- **`attrs()` for default props** — small, will land in M9 cleanup.
- **`extractCritical()` for SSR** — lands with PR #12.
- **DevTools panel for the stylesheet** — extension of the inspector overlay from PR #7.
