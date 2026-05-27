import render from '../core/render';
import type { FunctionComponent, VNode } from '../core/types';

/**
 * Hydrate a server-rendered tree.
 *
 * For now, this is a thin wrapper around `render`. Reactisma's reconciler
 * already preserves existing DOM nodes when the type matches, so calling
 * `render(component, container)` over an SSR-populated container reuses the
 * existing tags and only attaches handlers/state. A full mismatch warning
 * system is on the M11 roadmap.
 */
export function hydrate(component: FunctionComponent | VNode, container: Node): void {
  render(component, container);
}
