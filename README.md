# Reactisma — Nexus

A production-grade reimplementation of React (Virtual DOM, hooks, scheduler) built from scratch in TypeScript, paired with a dual-brain neural network with emotional memory that recognizes hand-drawn digits in the browser.

This repository is also the companion project of the **Reactisma course** for senior React developers — every module of the course produces a real PR that ships to `main`.

> Status: pre-1.0. The library is being progressively hardened over 16 PRs. See [the course roadmap](#course-roadmap) below.

---

## Why this exists

- **Understand React from first principles.** Most developers can use React. Few have written one. Reactisma exists so you can read the entire VDOM, the scheduler, the hooks system and the reconciler end-to-end in TypeScript.
- **Cover the parts most tutorials skip.** Concurrent rendering, time-slicing, Suspense, SSR with hydration, synthetic events with batching, a Fiber-like work loop, and a typed CSS-in-JS library with atomic CSS and SSR critical extraction.
- **Practical, not toy.** The app is a working neural-network playground: you draw, the network trains in a Web Worker with WASM matmul, an LSH-indexed emotional memory recalls similar past examples.

---

## Quick start

Prerequisites: **Node.js 20.19+** (or 22.12+), npm 10+.

```bash
git clone https://github.com/<your-org>/reactisma-nexus.git
cd reactisma-nexus
npm install
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:5173`).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check, then build the production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint over the whole repo |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm test` | Test runner (Vitest, lands in M9/PR #10) |

---

## Architecture

```
src/
├── libs/
│   ├── Reactisma/            # Custom React-like library
│   │   ├── core/             # createElement, render, diff, scheduler, mount/unmount
│   │   ├── hooks/            # useState, useRef, useEffect, useCallback (more landing)
│   │   ├── dom/              # Prop pipeline: events, style, refs, controlled inputs
│   │   └── index.ts          # Public API (Reactisma default export)
│   └── StyledComponent/      # Tagged-template-literal CSS-in-JS
│       ├── index.ts          # styled, ThemeProvider, keyframes (WIP)
│       ├── registry.ts       # Style cache and DOM injection
│       └── utils.ts          # snake-case ↔ camelCase helpers
│
├── classes/
│   ├── DualBrainNN.ts        # Dual-hemisphere neural network (sigmoid + tanh + softmax)
│   └── EmotionalMemory.ts    # k-NN over (input, emotion) tuples
│
├── components/               # Demo app components (App, DrawingCanvas, ...)
├── hooks/                    # App-level hooks: useDrawing, useDebounce
├── utils/                    # activations, random, emotion extraction
├── styles/styled.ts          # Concrete styled components for the demo
├── jsx.d.ts                  # JSX namespace for Reactisma
└── main.tsx                  # Entry point
```

### Reactisma data flow

```
JSX (component returns)
   │
   ▼
createElement → VNode tree
   │
   ▼
mount (first render)     ─► DOM nodes
diff  (subsequent render) ─► minimal DOM mutations
   │
   ▼
scheduler  (microtasks → fiber-like loop in M4)
   │
   ▼
hooks: state, refs, effects, callbacks (more in M3/M5)
```

### Dual-brain neural network

The network has two parallel hidden layers ("hemispheres") that process the same input:

- **Left hemisphere** — sigmoid activation. Smoother, bounded `[0, 1]` outputs.
- **Right hemisphere** — `tanh` activation. Centered around zero, `[-1, 1]`.

Their outputs are concatenated and fed through an integration layer, then a softmax output layer. The architecture, weights, and learning algorithm are all production-grade after M12 (Float32Array, Xavier init, softmax + cross-entropy, Adam, dropout, L2).

The **emotional memory** stores past examples tagged with the prediction class plus three "emotional" descriptors of the drawing (density, symmetry, complexity). When the network is uncertain, the memory is queried via cosine similarity weighted by emotional proximity. After M14 the lookup uses LSH for sub-linear retrieval.

---

## Course roadmap

| Module | Title | PR | Status |
| ---: | --- | ---: | :---: |
| 0 | Setup and repo archaeology | #1 | in progress |
| 1 | Virtual DOM and JSX from scratch | #2 | planned |
| 2 | Reconciliation, keys, and unmount cleanup | #3 | planned |
| 3 | Deep hooks: state, deps, rules | #4 | planned |
| 4 | Fiber-like work loop and priorities | #5 | planned |
| 5 | Advanced hooks, Fragment, Error Boundaries | #6 | planned |
| 6 | Synthetic events, real batching, DevTools | #7 | planned |
| 7 | StyledComponent v1: parser, typing, insertRule | #8 | planned |
| 8 | StyledComponent v2: Atomic CSS, Theme, SSR, DevTools | #9 | planned |
| 9 | Testing: Vitest, custom testing-library, CI | #10 | planned |
| 10 | Concurrent rendering, Suspense, lazy | #11 | planned |
| 11 | SSR and hydration | #12 | planned |
| 12 | Production-grade NN (Float32Array, Adam, dropout) | #13 | planned |
| 13 | Web Workers and WASM | #14 | planned |
| 14 | Scalable emotional memory, IndexedDB | #15 | planned |
| 15 | Playground, visualization, deploy | #16 | planned |

Each PR is mergeable on `main` and ships independently. The repository state at any point reflects the cumulative work up to that module.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs and issues are welcome; conventional commits are required.

## License

MIT
