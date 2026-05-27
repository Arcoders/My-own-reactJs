import { describe, it, expect, vi } from 'vitest';
import {
  scheduleCallback,
  cancelTask,
  shouldYield,
  NormalPriority,
  ImmediatePriority,
  IdlePriority,
} from '../scheduler';

describe('scheduler', () => {
  it('runs a scheduled callback', async () => {
    const fn = vi.fn();
    scheduleCallback(NormalPriority, fn);
    await new Promise((r) => setTimeout(r, 30));
    expect(fn).toHaveBeenCalled();
  });

  it('does not run a cancelled task', async () => {
    const fn = vi.fn();
    const task = scheduleCallback(NormalPriority, fn);
    cancelTask(task);
    await new Promise((r) => setTimeout(r, 30));
    expect(fn).not.toHaveBeenCalled();
  });

  it('runs immediate tasks before normal ones', async () => {
    const order: string[] = [];
    scheduleCallback(NormalPriority, () => order.push('normal'));
    scheduleCallback(ImmediatePriority, () => order.push('immediate'));
    await new Promise((r) => setTimeout(r, 30));
    expect(order).toEqual(['immediate', 'normal']);
  });

  it('runs idle tasks last', async () => {
    const order: string[] = [];
    scheduleCallback(IdlePriority, () => order.push('idle'));
    scheduleCallback(NormalPriority, () => order.push('normal'));
    await new Promise((r) => setTimeout(r, 30));
    expect(order).toEqual(['normal', 'idle']);
  });

  it('shouldYield returns boolean', () => {
    expect(typeof shouldYield()).toBe('boolean');
  });
});
