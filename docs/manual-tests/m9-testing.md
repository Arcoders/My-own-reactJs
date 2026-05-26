# Module 9 — Testing setup

PR #10 introduces a Vitest + JSDOM testing stack, custom testing utilities, and a working test suite for the core APIs (createElement, DOM dispatcher, hooks, scheduler, CSS parser).

## Setup

After pulling this PR, install the new devDeps:

```bash
npm install
```

This pulls in `vitest`, `@vitest/coverage-v8`, and `jsdom`.

## Running tests

| Script | What it does |
| --- | --- |
| `npm test` | Run all specs once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Run with v8 coverage; HTML report under `coverage/` |

The suite is fast (under 2 s on a modern laptop) and runs as part of the GH Actions workflow.

## Layout

```
src/
├── test-setup.ts                                # afterEach DOM cleanup
├── libs/Reactisma/__tests__/
│   ├── testing-utils.ts                         # render(), fireClick(), flushAsync()
│   ├── createElement.test.ts                    # VNode shape, key extraction
│   ├── dom-dispatcher.test.ts                   # class, style, value, event, ref
│   ├── hooks.test.ts                            # useState/Reducer/Memo/Ref/Effect/Context
│   └── scheduler.test.ts                        # priority ordering, cancel
└── libs/StyledComponent/__tests__/
    └── parser.test.ts                           # parseCss + expandRules
```

## Test utilities

[`testing-utils.ts`](../../src/libs/Reactisma/__tests__/testing-utils.ts) exposes:

- `render(component)` — mounts into a fresh container; returns `{ container, unmount, rerender }`.
- `fireClick(el)` — bubbles a click through the delegated event system (PR #7).
- `flushAsync()` — yields long enough for microtasks + the MessageChannel loop to drain.

These deliberately mimic `@testing-library/react`'s shape; the migration path is one of "rename `Reactisma.render` to React's `render` and adjust queries".

## Adding new tests

Follow the convention `src/**/__tests__/<feature>.test.ts`. Vitest picks them up automatically.

```ts
import { describe, it, expect } from 'vitest';
import { render, fireClick, flushAsync } from './testing-utils';
import Reactisma from '..';

describe('my feature', () => {
  it('does X', async () => {
    const Comp = () => { /* ... */ };
    const { container } = render(Comp);
    fireClick(container.querySelector('button')!);
    await flushAsync();
    expect(container.querySelector('span')!.textContent).toBe('expected');
  });
});
```

## What this PR doesn't cover yet

- Snapshot serializer for VNodes (planned alongside the iterative reconciler).
- Async testing helpers like `waitFor` / `findByText` — easy follow-up.
- Custom matchers for StyledComponent (`toHaveStyle`, `toHaveClass`) — designed but not implemented; current tests use `getAttribute` and `el.style.*` directly.

The full CI matrix (Node 20.19 and 22.12) is defined in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) since PR #1.
