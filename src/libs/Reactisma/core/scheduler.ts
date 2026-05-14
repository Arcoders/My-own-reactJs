import type { FunctionComponent } from './types';

let rootComponent: FunctionComponent | null = null;
let rootContainer: Node | null = null;
let isScheduled = false;
let renderFunction: ((component: FunctionComponent, container: Node) => void) | null = null;

export function setRenderFunction(fn: (component: FunctionComponent, container: Node) => void): void {
  renderFunction = fn;
}

export function setRoot(component: FunctionComponent, container: Node): void {
  rootComponent = component;
  rootContainer = container;
}

export function scheduleRender(): void {
  if (!isScheduled && rootComponent && rootContainer && renderFunction) {
    isScheduled = true;
    const component = rootComponent;
    const container = rootContainer;
    const render = renderFunction;
    Promise.resolve().then(() => {
      isScheduled = false;
      render(component, container);
    });
  }
}