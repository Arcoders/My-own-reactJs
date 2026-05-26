import Reactisma from '..';
import type { FunctionComponent } from '../core/types';

export interface RenderResult {
  container: HTMLElement;
  unmount: () => void;
  rerender: () => void;
}

/**
 * Mounts a component inside a fresh container for a test. It returns the
 * container, an `unmount` helper, and a `rerender` helper that starts
 * another render cycle. The `rerender` helper does not need any state
 * change, so it is useful to check that rendering twice gives the same
 * result.
 */
export function render(component: FunctionComponent): RenderResult {
  const container = document.createElement('div');
  document.body.appendChild(container);
  Reactisma.render(component, container);
  return {
    container,
    unmount: () => {
      container.remove();
    },
    rerender: () => {
      Reactisma.render(component, container);
    },
  };
}

/**
 * Yield to the scheduler so queued tasks (microtasks + the MessageChannel
 * loop from PR #5) get a chance to run.
 */
export function flushAsync(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(() => queueMicrotask(() => setTimeout(resolve, 10)));
  });
}

/**
 * Dispatch a click on an element through the delegated event system from PR #7.
 */
export function fireClick(target: Element): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}
