import { IdlePriority, runWithPriority, scheduleCallback } from '../scheduler';
import { useCallback, useEffect, useState } from './hooks';

/**
 * Returns [isPending, startTransition].
 *
 * `isPending` is true from the moment `start(...)` is called until the
 * scheduler has actually flushed the work queued by it. Implementation:
 *  - `setIsPending(true)` triggers an urgent render so the indicator shows.
 *  - Inside a `scheduleCallback(Idle, ...)` we run the user callback (whose
 *    setStates inherit Idle priority via `runWithPriority`).
 *  - A second `scheduleCallback(Idle, ...)` flips the flag back AFTER the
 *    work has been dispatched, which is the closest commit-end approximation
 *    we have without a real fiber commit phase.
 */
export function useTransition(): [boolean, (callback: () => void) => void] {
  const [isPending, setIsPending] = useState(false);

  const start = useCallback((callback: () => void): void => {
    setIsPending(true);
    scheduleCallback(IdlePriority, () => {
      runWithPriority(IdlePriority, callback);
      // Queue the reset AFTER the work just dispatched. Because the scheduler
      // is a FIFO within the same priority bucket, this lands after every
      // setState scheduled by `callback` has been processed.
      scheduleCallback(IdlePriority, () => setIsPending(false));
    });
  }, []);

  return [isPending, start];
}

/**
 * Returns a value that lags behind `value` during transitions. The deferred
 * setState runs at Idle priority so urgent work (the input echo) commits
 * first.
 */
export function useDeferredValue<T>(value: T): T {
  const [deferred, setDeferred] = useState(value);

  useEffect(() => {
    let cancelled = false;
    const task = scheduleCallback(IdlePriority, () => {
      if (cancelled) return;
      runWithPriority(IdlePriority, () => setDeferred(value));
    });
    return () => {
      cancelled = true;
      task.cancelled = true;
    };
  }, [value]);

  return deferred;
}
