import diff from './diff';
import { setRoot, setRenderFunction } from './scheduler';
import { runLayoutEffects, runEffects } from '../hooks';
import { ensureRootListeners } from '../events';
import type { VNode, FunctionComponent } from './types';

function render(component: FunctionComponent | VNode, container: Node): void {
  // Idempotent: one delegated listener per (root, eventType) pair.
  ensureRootListeners(container);

  if (typeof component === 'function') {
    setRoot(component, container);
    const rootVdom: VNode = {
      type: component,
      props: {},
      children: [],
    };
    diff(rootVdom, container, container.firstChild);
  } else {
    diff(component, container, container.firstChild);
  }
  // Layout effects run synchronously after DOM mutations and BEFORE the
  // regular effects (so consumers can read layout / write style without
  // racing against pre-paint side effects).
  runLayoutEffects();
  runEffects();
}

setRenderFunction(render as (component: FunctionComponent, container: Node) => void);
export default render;