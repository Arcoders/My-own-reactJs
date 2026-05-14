import diff from './diff';
import { setRoot, setRenderFunction } from './scheduler';
import { runEffects } from '../hooks';
import type { VNode, FunctionComponent } from './types';

function render(component: FunctionComponent | VNode, container: Node): void {
  if (typeof component === 'function') {
    setRoot(component, container);
    const rootVdom: VNode = {
      type: component,
      props: {},
      children: []
    };
    diff(rootVdom, container, container.firstChild);
  } else {
    diff(component, container, container.firstChild);
  }
  runEffects();
}

setRenderFunction(render as (component: FunctionComponent, container: Node) => void);
export default render;