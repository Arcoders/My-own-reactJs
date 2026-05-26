import type { FunctionComponent } from './types';
import {
  cancelTask,
  getCurrentPriority,
  scheduleCallback,
  type Task,
} from '../scheduler';

let rootComponent: FunctionComponent | null = null;
let rootContainer: Node | null = null;
let pendingTask: Task | null = null;
let renderFunction: ((component: FunctionComponent, container: Node) => void) | null = null;

export function setRenderFunction(
  fn: (component: FunctionComponent, container: Node) => void
): void {
  renderFunction = fn;
}

export function setRoot(component: FunctionComponent, container: Node): void {
  rootComponent = component;
  rootContainer = container;
}

export function scheduleRender(): void {
  if (!rootComponent || !rootContainer || !renderFunction) return;
  if (pendingTask && !pendingTask.cancelled) return;

  const component = rootComponent;
  const container = rootContainer;
  const render = renderFunction;
  const priority = getCurrentPriority();

  pendingTask = scheduleCallback(priority, () => {
    pendingTask = null;
    render(component, container);
  });
}

// A small back door for tests and devtools. App code should never need this.
// If you find yourself calling it from a component, something is wrong.
export function _cancelPendingRender(): void {
  if (pendingTask) {
    cancelTask(pendingTask);
    pendingTask = null;
  }
}
