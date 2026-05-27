import { type Priority, timeoutForPriority } from './priorities';

export interface Task {
  readonly id: number;
  readonly priority: Priority;
  callback: (() => void) | null;
  expirationTime: number;
  cancelled: boolean;
}

const FRAME_SLICE_MS = 5;

const taskQueue: Task[] = [];
let nextTaskId = 0;
let deadline = 0;
let isHostLoopRunning = false;
let isFlushing = false;

const channel: MessageChannel | null =
  typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;
if (channel) {
  channel.port1.onmessage = performWorkUntilDeadline;
}

function postWork(): void {
  if (channel) {
    channel.port2.postMessage(null);
  } else {
    setTimeout(performWorkUntilDeadline, 0);
  }
}

function insertSorted(task: Task): void {
  // Binary insert by expiration time. Earlier deadlines come out first. A
  // linear scan was fine when the queue was small, but once it grew past a
  // few dozen items it started showing up in the profiler, so we use binary
  // search now.
  let lo = 0;
  let hi = taskQueue.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (taskQueue[mid].expirationTime <= task.expirationTime) lo = mid + 1;
    else hi = mid;
  }
  taskQueue.splice(lo, 0, task);
}

export function scheduleCallback(priority: Priority, callback: () => void): Task {
  const now = performance.now();
  const task: Task = {
    id: ++nextTaskId,
    priority,
    callback,
    expirationTime: now + timeoutForPriority(priority),
    cancelled: false,
  };
  insertSorted(task);
  if (!isHostLoopRunning) {
    isHostLoopRunning = true;
    postWork();
  }
  return task;
}

export function cancelTask(task: Task): void {
  task.cancelled = true;
  task.callback = null;
}

export function shouldYield(): boolean {
  return performance.now() >= deadline;
}

export function isFlushingWork(): boolean {
  return isFlushing;
}

function performWorkUntilDeadline(): void {
  deadline = performance.now() + FRAME_SLICE_MS;
  isFlushing = true;
  let hasMoreWork = false;
  try {
    hasMoreWork = flushWork();
  } finally {
    isFlushing = false;
    if (hasMoreWork) {
      postWork();
    } else {
      isHostLoopRunning = false;
    }
  }
}

function flushWork(): boolean {
  while (taskQueue.length > 0) {
    const task = taskQueue[0];

    if (task.cancelled || task.callback === null) {
      taskQueue.shift();
      continue;
    }

    const now = performance.now();
    const isExpired = task.expirationTime <= now;
    if (!isExpired && shouldYield()) {
      // We are out of time for this frame. Give control back to the
      // browser so it can paint and handle input. We will pick up where
      // we stopped on the next MessageChannel tick. This is the heart of
      // interruptible rendering. Without it, big trees freeze the page.
      return true;
    }

    taskQueue.shift();
    const callback = task.callback;
    task.callback = null;
    try {
      callback();
    } catch (err) {
      // One failing task should not stop the whole queue. We log it loudly
      // and keep going. The code that scheduled the task can deal with the
      // failure on its own.
      // eslint-disable-next-line no-console
      console.error('[scheduler] task failed:', err);
    }
  }
  return false;
}

// A read-only snapshot of the queue, used by the devtools panel and by
// tests. Do not use it from app code. The queue changes very fast, so the
// snapshot is already old the moment you receive it.
export function _peekTasks(): ReadonlyArray<Pick<Task, 'id' | 'priority' | 'expirationTime' | 'cancelled'>> {
  return taskQueue.map((t) => ({
    id: t.id,
    priority: t.priority,
    expirationTime: t.expirationTime,
    cancelled: t.cancelled,
  }));
}
