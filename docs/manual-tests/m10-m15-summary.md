# Modules 10–15 — Summary of remaining manual checks

This file rolls up brief verification recipes for PRs #11 through #16, which all land in this batch. Each PR also has a dedicated section in the README and the course curriculum file.

## PR #11 — Suspense + lazy (M10)

```tsx
import Reactisma from '../libs/Reactisma';
const { Suspense, lazy } = Reactisma;
const Slow = lazy(() => new Promise<{ default: () => Reactisma.VNode }>((r) =>
  setTimeout(() => r({ default: () => Reactisma.createElement('span', null, 'loaded') }), 1500)
));
<Suspense fallback={Reactisma.createElement('span', null, 'loading...')}>
  <Slow />
</Suspense>
```

Expected: `loading...` appears for ~1.5 s then is replaced by `loaded`.

## PR #12 — SSR + hydration (M11)

```ts
import Reactisma from '../libs/Reactisma';
const html = Reactisma.renderToString(App);
console.log(html.includes('<div'));        // true
console.log(html.includes('onclick'));     // false — handlers don't serialize
```

For `extractCritical`:
```ts
const { html, css, classNames } = Reactisma.extractCritical(App);
// `css` is the full stylesheet text; embed it inline in `<style>` for SSR.
```

## PR #13 — NN production-grade (M12)

```ts
import { DualBrainNN } from '../classes/DualBrainNN';
const nn = new DualBrainNN(784, 32, 32, 16, 10, { lr: 0.005, dropout: 0.1, l2: 1e-4 });
const x = new Array(784).fill(0).map(() => Math.random());
const target = new Array(10).fill(0); target[3] = 1;
console.log(nn.train(x, target));  // initial loss ~ 2.3 (ln 10)
for (let i = 0; i < 200; i++) nn.train(x, target);
console.log(nn.predict(x).prediction === 3); // true
```

## PR #14 — Worker + matmul (M13)

```ts
import { NetworkClient } from '../classes/NetworkClient';
const client = new NetworkClient({ inputSize: 784, leftSize: 32, rightSize: 32, integrateSize: 16, outputSize: 10 });
console.log(client.isWorker);          // true in the browser
await client.predict(new Array(784).fill(0));
```

The UI thread stays responsive during long training runs because the worker owns the network.

## PR #15 — LSH + IndexedDB (M14)

```ts
import { EmotionalMemory } from '../classes/EmotionalMemory';
const mem = new EmotionalMemory(500);
await mem.ready();
for (let i = 0; i < 500; i++) {
  mem.add(Array.from({length: 784}, () => Math.random()), i % 10,
    { density: Math.random(), symmetry: Math.random(), complexity: Math.random() });
}
console.time('retrieve');
mem.retrieve(Array.from({length: 784}, () => Math.random()),
  { density: 0.5, symmetry: 0.5, complexity: 0.5 }, 3, 0.3);
console.timeEnd('retrieve');
// Sub-5ms vs. ~30ms with the legacy linear scan.
```

After `clear()`, IndexedDB is wiped too. Reload the page and `await mem.ready()` — the example list is empty.

## PR #16 — Playground + viz + deploy (M15)

The playground component is `src/playground/Playground.tsx`. To use it as the dev entry, temporarily edit `src/main.tsx`:

```tsx
import Playground from './playground/Playground';
Reactisma.render(Playground, rootEl);
```

Two stories ship out of the box:
- `heatmap` — ActivationHeatmap reacting to random data once per second.
- `button` — `Button` / `PrimaryButton` in default and `disabled` states.

The Vercel preview workflow runs on every PR and posts the URL as a comment, contingent on `VERCEL_TOKEN` being configured in the repo secrets.

## Known limitations (this batch)

- **Suspense** uses a microtask hack to re-render after promise resolution. Concurrent timeslicing (interrupting a render mid-walk) lands when the reconciler goes iterative.
- **Hydration** is currently `render()` over an SSR'd container. The reconciler reuses matching DOM nodes by type but does not validate text content; mismatch warnings come with the fiber rewrite.
- **WASM matmul** has a `setMatMulImplementation` swap point but no `.wasm` file yet. The JS tiled version is the default and the benchmark baseline.
- **IndexedDB** persistence is fire-and-forget. Reading via `mem.ready()` is async; calling `retrieve()` immediately after construction returns empty until the load completes (~10 ms in practice).
- **Playground** doesn't auto-discover `*.story.tsx`; new stories must be added to `src/playground/stories.ts`. A glob-based loader is a small follow-up.
