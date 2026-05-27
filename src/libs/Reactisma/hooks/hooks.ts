import { scheduleRender } from '../core/scheduler';
import {
  depsChanged,
  enqueueEffect,
  enqueueLayoutEffect,
  getCurrentInstance,
} from './internal';

export function useState<T>(
  initialValue: T | (() => T)
): [T, (newState: T | ((prev: T) => T)) => void] {
  const instance = getCurrentInstance('useState');
  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'state') {
    const resolved =
      typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    hook = { type: 'state', state: resolved };
    hooks[hookIndex] = hook;
  }

  const stateHook = hook;
  const setState = (newState: T | ((prev: T) => T)) => {
    const resolved =
      typeof newState === 'function'
        ? (newState as (prev: T) => T)(stateHook.state as T)
        : newState;
    if (!Object.is(resolved, stateHook.state)) {
      stateHook.state = resolved;
      scheduleRender();
    }
  };

  return [hook.state as T, setState];
}

export function useRef<T>(initialValue: T): { current: T };
export function useRef<T>(initialValue: T | null): { current: T | null };
export function useRef<T = undefined>(): { current: T | undefined };
export function useRef<T>(initialValue?: T | null): { current: T | null | undefined } {
  const instance = getCurrentInstance('useRef');
  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'ref') {
    hook = { type: 'ref', current: initialValue ?? null };
    hooks[hookIndex] = hook;
  }

  return hook as { current: T | null | undefined };
}

export function useEffect(callback: () => void | (() => void), dependencies?: unknown[]): void {
  const instance = getCurrentInstance('useEffect');
  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'effect') {
    hook = { type: 'effect', dependencies: undefined, cleanup: undefined };
    hooks[hookIndex] = hook;
  }

  if (depsChanged(dependencies, hook.dependencies)) {
    hook.dependencies = dependencies;
    enqueueEffect({ instance, hook, callback });
  }
}

/**
 * Same idea as useEffect, but it runs after the DOM is updated and *before*
 * the browser paints. Use it when you need to measure layout, or to fix
 * something in the DOM so the user does not see a flash for one frame.
 *
 * For everything else, use useEffect. This one blocks the paint, so do not
 * put slow work inside it.
 */
export function useLayoutEffect(
  callback: () => void | (() => void),
  dependencies?: unknown[]
): void {
  const instance = getCurrentInstance('useLayoutEffect');
  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'layout-effect') {
    hook = { type: 'layout-effect', dependencies: undefined, cleanup: undefined };
    hooks[hookIndex] = hook;
  }

  if (depsChanged(dependencies, hook.dependencies)) {
    hook.dependencies = dependencies;
    enqueueLayoutEffect({ instance, hook, callback });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies?: unknown[]
): T {
  const instance = getCurrentInstance('useCallback');
  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'callback') {
    hook = { type: 'callback', callback, dependencies };
    hooks[hookIndex] = hook;
  }

  if (depsChanged(dependencies, hook.dependencies)) {
    hook.callback = callback;
    hook.dependencies = dependencies;
  }

  return hook.callback as T;
}
