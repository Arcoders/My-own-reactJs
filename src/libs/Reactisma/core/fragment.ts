import createElement from './create-element';
import type { FunctionComponent, VNode } from './types';

/**
 * Fragment renders its children without adding a layout-affecting wrapper.
 *
 * Implementation note: we wrap children in a `<div data-fragment style="display: contents">`.
 * `display: contents` makes the div ignored by the layout algorithm
 * (children participate in the parent's flex/grid as if the div were not there),
 * which is the closest single-DOM-node approximation of React's true Fragment.
 *
 * A "real" Fragment (one VNode → multiple DOM siblings) requires the iterative
 * fiber rewrite of the reconciler (post M4). Documented in the course as a
 * follow-up exercise.
 */
const Fragment: FunctionComponent<{ children?: VNode | VNode[] }> = ({ children }) => {
  const arr = Array.isArray(children) ? children : children ? [children] : [];
  return createElement(
    'div',
    { 'data-fragment': '', style: { display: 'contents' } },
    ...arr
  );
};
Fragment.displayName = 'Fragment';

export default Fragment;
