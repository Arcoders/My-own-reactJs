import { ComponentInstance, type Hook } from '../core/types';

let currentlyRenderingInstance: ComponentInstance | null = null;

export function setCurrentlyRenderingInstance(instance: ComponentInstance | null): void {
  currentlyRenderingInstance = instance;
}

export function getCurrentInstance(label: string): ComponentInstance {
  if (!currentlyRenderingInstance) {
    throw new Error(`${label} must be called inside a component render`);
  }
  return currentlyRenderingInstance;
}

export interface EffectQueueEntry {
  instance: ComponentInstance;
  hook: Hook;
  callback: () => void | (() => void);
}

let effectQueue: EffectQueueEntry[] = [];
let layoutEffectQueue: EffectQueueEntry[] = [];

export function enqueueEffect(entry: EffectQueueEntry): void {
  effectQueue.push(entry);
}

export function enqueueLayoutEffect(entry: EffectQueueEntry): void {
  layoutEffectQueue.push(entry);
}

function drain(queue: EffectQueueEntry[], expectedType: 'effect' | 'layout-effect'): void {
  for (const { hook, callback } of queue) {
    if (hook.type !== expectedType) continue;
    if (hook.cleanup) hook.cleanup();
    const cleanup = callback();
    hook.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
  }
}

export function drainLayoutEffects(): void {
  const q = layoutEffectQueue;
  layoutEffectQueue = [];
  drain(q, 'layout-effect');
}

export function drainEffects(): void {
  const q = effectQueue;
  effectQueue = [];
  drain(q, 'effect');
}

export function runCleanupEffects(instance: ComponentInstance): void {
  for (const hook of instance.hooks) {
    if ((hook.type === 'effect' || hook.type === 'layout-effect') && hook.cleanup) {
      hook.cleanup();
      hook.cleanup = undefined;
    }
  }
}

export function depsChanged(
  next: readonly unknown[] | undefined,
  prev: readonly unknown[] | undefined
): boolean {
  if (!next || !prev) return true;
  if (next.length !== prev.length) return true;
  for (let i = 0; i < next.length; i++) {
    if (!Object.is(next[i], prev[i])) return true;
  }
  return false;
}
