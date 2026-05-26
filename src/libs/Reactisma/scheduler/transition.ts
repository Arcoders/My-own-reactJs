import { IdlePriority, NormalPriority, type Priority } from './priorities';

let currentPriority: Priority = NormalPriority;

export function getCurrentPriority(): Priority {
  return currentPriority;
}

export function runWithPriority<T>(priority: Priority, fn: () => T): T {
  const prev = currentPriority;
  currentPriority = priority;
  try {
    return fn();
  } finally {
    currentPriority = prev;
  }
}

/**
 * "This work is not urgent, let typing and clicks go first."
 *
 * It runs `callback` at idle priority. Any state updates inside it also
 * get the idle label, so they wait for more important work to finish.
 */
export function startTransition(callback: () => void): void {
  runWithPriority(IdlePriority, callback);
}
