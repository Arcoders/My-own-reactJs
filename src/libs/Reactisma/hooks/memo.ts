import { depsChanged, getCurrentInstance } from './internal';

export function useMemo<T>(factory: () => T, dependencies?: unknown[]): T {
  const instance = getCurrentInstance('useMemo');
  const hookIndex = instance.hookIndex++;
  const hooks = instance.hooks;

  let hook = hooks[hookIndex];
  if (!hook || hook.type !== 'memo') {
    hook = { type: 'memo', value: factory(), dependencies };
    hooks[hookIndex] = hook;
    return hook.value as T;
  }

  if (depsChanged(dependencies, hook.dependencies)) {
    hook.value = factory();
    hook.dependencies = dependencies;
  }

  return hook.value as T;
}
