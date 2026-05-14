import { scheduleRender } from '../core/scheduler';
import { ComponentInstance, type Hook } from '../core/types';

let currentlyRenderingInstance: ComponentInstance | null = null;
let effectQueue: Array<{ instance: ComponentInstance; hook: Hook; callback: () => void | (() => void) }> = [];

export function setCurrentlyRenderingInstance(instance: ComponentInstance | null) {
  currentlyRenderingInstance = instance;
}

export function useState<T>(initialValue: T | (() => T)): [T, (newState: T | ((prev: T) => T)) => void] {
  const instance = currentlyRenderingInstance;
  if (!instance) throw new Error('useState must be called in a component');

  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'state') {
    const resolvedInitial = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    hook = { type: 'state', state: resolvedInitial };
    hooks[hookIndex] = hook;
  }

  const setState = (newState: T | ((prev: T) => T)) => {
    const resolvedState = typeof newState === 'function' ? (newState as (prev: T) => T)(hook.state as T) : newState;
    if (resolvedState !== hook.state) {
      hook.state = resolvedState;
      scheduleRender();
    }
  };

  return [hook.state as T, setState];
}

export function useRef<T>(initialValue: T): { current: T } {
  const instance = currentlyRenderingInstance;
  if (!instance) throw new Error('useRef must be called in a component');

  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'ref') {
    hook = { type: 'ref', current: initialValue };
    hooks[hookIndex] = hook;
  }

  return hook as { current: T };
}

export function useEffect(callback: () => void | (() => void), dependencies?: unknown[]): void {
  const instance = currentlyRenderingInstance;
  if (!instance) throw new Error('useEffect must be called in a component');

  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'effect') {
    hook = { type: 'effect', dependencies: undefined, cleanup: undefined };
    hooks[hookIndex] = hook;
  }

  const hasChanged = !dependencies ||
    !hook.dependencies ||
    dependencies.length !== hook.dependencies.length ||
    (() => {
      const deps = hook.dependencies as unknown[];
      return dependencies.some((dep, i) => dep !== deps[i]);
    })();

  if (hasChanged) {
    hook.dependencies = dependencies;
    effectQueue.push({ instance, hook, callback });
  }
}

export function useCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  dependencies?: unknown[]
): T {
  const instance = currentlyRenderingInstance;
  if (!instance) throw new Error('useCallback must be called in a component');

  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'callback') {
    hook = { type: 'callback', callback, dependencies };
    hooks[hookIndex] = hook;
  }

  const hasChanged = !dependencies ||
    !hook.dependencies ||
    dependencies.length !== hook.dependencies.length ||
    (() => {
      const deps = hook.dependencies as unknown[];
      return dependencies.some((dep, i) => dep !== deps[i]);
    })();

  if (hasChanged) {
    hook.callback = callback;
    hook.dependencies = dependencies;
  }

  return hook.callback as T;
}

export function runEffects() {
  effectQueue.forEach(({ hook, callback }) => {
    if (hook.type === 'effect' && hook.cleanup) hook.cleanup();
    const cleanup = callback();
    if (hook.type === 'effect') {
      hook.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
    }
  });
  effectQueue = [];
}

export function runCleanupEffects(instance: ComponentInstance) {
  instance.hooks.forEach(hook => {
    if (hook.type === 'effect' && hook.cleanup) hook.cleanup();
  });
}