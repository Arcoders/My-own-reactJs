export const ImmediatePriority = 1 as const;
export const UserBlockingPriority = 2 as const;
export const NormalPriority = 3 as const;
export const IdlePriority = 4 as const;

export type Priority = 1 | 2 | 3 | 4;

const IMMEDIATE_TIMEOUT_MS = -1;
const USER_BLOCKING_TIMEOUT_MS = 250;
const NORMAL_TIMEOUT_MS = 5_000;
const IDLE_TIMEOUT_MS = 1_073_741_823; // ~max safe 31-bit int

export function timeoutForPriority(priority: Priority): number {
  switch (priority) {
    case ImmediatePriority:
      return IMMEDIATE_TIMEOUT_MS;
    case UserBlockingPriority:
      return USER_BLOCKING_TIMEOUT_MS;
    case NormalPriority:
      return NORMAL_TIMEOUT_MS;
    case IdlePriority:
      return IDLE_TIMEOUT_MS;
  }
}

export function priorityName(priority: Priority): string {
  switch (priority) {
    case ImmediatePriority:
      return 'Immediate';
    case UserBlockingPriority:
      return 'UserBlocking';
    case NormalPriority:
      return 'Normal';
    case IdlePriority:
      return 'Idle';
  }
}
