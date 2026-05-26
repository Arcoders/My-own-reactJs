import createElement from '../core/create-element';
import { useEffect, useState } from '../hooks';
import type { FunctionComponent, VNode } from '../core/types';

/**
 * This is what a suspending hook (like `lazy`) throws to say "I am not ready
 * yet, please wait for this promise". Yes, throwing for flow control feels
 * a bit weird, but React does the same thing, and for a good reason: a deep
 * child can pause rendering without every layer in between having to know.
 *
 * The reconciler catches it when it calls the component, and then it tells
 * the closest <Suspense> parent to show its fallback. When the promise is
 * done, we try the children again.
 */
export class SuspenseException {
  readonly promise: Promise<unknown>;
  constructor(promise: Promise<unknown>) {
    this.promise = promise;
  }
}

export type SuspenseProps = {
  fallback: VNode;
  children?: VNode | VNode[];
} & Record<string, unknown>;

// The boundary stack works the same way as the Context provider stack. We
// push when we enter a <Suspense>, and pop after we finish its children. If
// a child throws to suspend, it talks to the boundary on top of the stack
// and asks it to show the fallback.
export interface SuspenseBoundary {
  notifyPending: (promise: Promise<unknown>) => void;
}

const boundaryStack: SuspenseBoundary[] = [];

export function pushSuspenseBoundary(b: SuspenseBoundary): void {
  boundaryStack.push(b);
}

export function popSuspenseBoundary(): void {
  boundaryStack.pop();
}

export function currentSuspenseBoundary(): SuspenseBoundary | undefined {
  return boundaryStack[boundaryStack.length - 1];
}

/**
 * `<Suspense fallback={<Spinner />}>...</Suspense>`
 *
 * Shows the `fallback` while a child is still loading. The child throws a
 * promise, the reconciler catches it, we render the fallback, and when the
 * promise is done we render the real children again. For the user it just
 * looks like "this thing was loading, now it is here", which is the simple
 * mental model I wanted to keep.
 */
export const Suspense: FunctionComponent<SuspenseProps> = (props) => {
  const [pending, setPending] = useState<Promise<unknown> | null>(null);

  // Push before returning the children. The order matters: the children
  // render inside this push/pop window. This works the same way as a
  // Context provider.
  pushSuspenseBoundary({
    notifyPending: (p) => {
      // Calling setState while a child is still rendering would call the
      // renderer again and break the hooks order. So we wait one tick.
      // A little annoying, but it keeps things safe.
      queueMicrotask(() => setPending(p));
    },
  });

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    const onSettle = () => {
      if (cancelled) return;
      setPending(null);
    };
    pending.then(onSettle, onSettle);
    return () => {
      cancelled = true;
    };
  }, [pending]);

  if (pending) {
    return props.fallback;
  }

  const children = props.children;
  if (Array.isArray(children)) {
    if (children.length === 1) return children[0];
    return createElement('div', { 'data-suspense': '', style: { display: 'contents' } }, ...children);
  }
  return (children as VNode) ?? { type: 'text', props: { textContent: '' }, children: [] };
};
(Suspense as { _isSuspenseBoundary?: true })._isSuspenseBoundary = true;
(Suspense as { displayName?: string }).displayName = 'Suspense';

export function isSuspenseBoundary(fn: FunctionComponent): boolean {
  return (fn as { _isSuspenseBoundary?: true })._isSuspenseBoundary === true;
}
