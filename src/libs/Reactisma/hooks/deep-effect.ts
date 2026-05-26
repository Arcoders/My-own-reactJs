import { enqueueEffect, getCurrentInstance } from './internal';

/**
 * Like useEffect, but it compares the dependencies in a deeper way (it looks
 * inside arrays and objects). Use it when your dependencies are objects or
 * arrays that you build again on every render. In that case, their identity
 * changes every time even if the values are the same.
 *
 * Reference compare is cheaper, so prefer the normal useEffect unless you
 * have a real problem that you can measure.
 */
export function useDeepCompareEffect(
  callback: () => void | (() => void),
  dependencies?: unknown[]
): void {
  const instance = getCurrentInstance('useDeepCompareEffect');
  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'effect') {
    hook = { type: 'effect', dependencies: undefined, cleanup: undefined };
    hooks[hookIndex] = hook;
  }

  const changed = !dependencies || !hook.dependencies || !deepEqualArray(dependencies, hook.dependencies);
  if (changed) {
    hook.dependencies = dependencies;
    enqueueEffect({ instance, hook, callback });
  }
}

function deepEqualArray(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!deepEqual(a[i], b[i])) return false;
  }
  return true;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (Array.isArray(b)) return false;

  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const key of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }
  return true;
}
