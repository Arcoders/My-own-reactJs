# Contributing to Reactisma

Thanks for considering a contribution. Reactisma is the companion repo of the Reactisma course, so a few conventions matter more here than in a typical OSS project:

1. Every change should be educational. If a refactor is "just" cleaner, write a paragraph in the PR explaining the **why**.
2. PRs map 1:1 with course modules where possible. If your change overlaps a planned module, please coordinate first (open an issue).
3. We prefer **boring, readable code**. No clever one-liners that future course readers will trip over.

---

## Workflow

1. Fork the repo and clone your fork.
2. Create a branch off `main`: `git checkout -b feat/short-description`.
3. Make changes, run `npm run typecheck`, `npm run lint`, `npm test`.
4. Commit using **conventional commits** (see below).
5. Push and open a PR against `main`. Fill out the template.

---

## Conventional commits

Format: `<type>(<scope>): <summary>`

Types we use:

| Type | When to use |
| --- | --- |
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `perf` | A performance improvement |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `test` | Adding/updating tests |
| `chore` | Tooling, build, dependencies |
| `style` | Formatting only (no logic change) |

Scopes are loose but try to be one of: `vdom`, `hooks`, `scheduler`, `reconciler`, `dom`, `styled`, `nn`, `memory`, `ssr`, `worker`, `wasm`, `devtools`, `course`.

Examples:

```
feat(hooks): add useReducer with action discrimination via TS narrowing
fix(reconciler): preserve component instance when reordering keyed children
perf(nn): switch dual hemispheres to Float32Array layout
docs(course): expand module 4 outline with diagram links
```

---

## PR checklist

Before requesting review, please confirm:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (no new warnings either)
- [ ] `npm run format:check` passes
- [ ] `npm test` passes
- [ ] The PR has a description explaining **why** (not just what)
- [ ] If the change is part of a course module, the module is referenced
- [ ] No leftover `console.log`, commented-out code, or dead imports

---

## Code style

- TypeScript strict mode is non-negotiable. Don't widen types with `any`; use `unknown` + narrowing.
- Functions should fit on a screen. If they don't, split them.
- Prefer pure functions in `utils/`. Side effects belong in components or in clearly-named lifecycle hooks.
- Hooks must follow the rules of hooks. We will land a custom ESLint rule for this in M3.

## Reporting issues

Open an issue with a reproduction case (link to a fork, a CodeSandbox, or a minimal `.tsx` snippet) and the expected vs. actual behavior. Tag with `bug`, `enhancement`, `question`, or `course`.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
