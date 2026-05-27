import { getCurrentInstance } from './internal';

let nextIdCounter = 0;

/**
 * Generate a stable id unique to (instance, hook position). The same hook
 * call returns the same id on every render of the same component instance,
 * which makes it safe for `aria-labelledby`, label/input association, etc.
 *
 * The counter is process-wide. For deterministic SSR matching, the server
 * and client must execute components in the same order; M11/PR #12 will
 * formalize this with a tree-position-based id (closer to React 18).
 */
export function useId(): string {
  const instance = getCurrentInstance('useId');
  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'id') {
    hook = { type: 'id', value: `:r${(++nextIdCounter).toString(36)}:` };
    hooks[hookIndex] = hook;
  }

  return hook.value;
}
