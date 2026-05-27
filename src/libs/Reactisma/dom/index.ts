import type { VNode } from '../core/types';
import { applyProp, cleanupProp } from './dispatcher';
import type { DOMElement } from './types';

function updateTextNode(node: Text, newVirtualElement: VNode, oldVirtualElement: VNode): void {
  const newText = newVirtualElement.props.textContent as string | undefined;
  const oldText = oldVirtualElement.props.textContent as string | undefined;
  if (newText !== oldText) {
    node.textContent = newText ?? null;
  }
  node.__$virtualDOM = newVirtualElement;
}

function updateProps(
  newProps: Record<string, unknown>,
  oldProps: Record<string, unknown>,
  el: DOMElement
): void {
  for (const propKey in newProps) {
    const newValue = newProps[propKey];
    const oldValue = oldProps[propKey];
    if (newValue === oldValue) continue;
    applyProp(el, propKey, newValue, oldValue);
  }
}

function removeOldProps(
  newProps: Record<string, unknown>,
  oldProps: Record<string, unknown>,
  el: DOMElement
): void {
  for (const propKey in oldProps) {
    if (propKey in newProps) continue;
    cleanupProp(el, propKey, oldProps[propKey]);
  }
}

function updateDOM(
  domElement: DOMElement,
  newVirtualElement: VNode,
  oldVirtualElement: VNode = { props: {} } as VNode
): void {
  const newProps = newVirtualElement.props || {};
  const oldProps = oldVirtualElement.props || {};
  updateProps(newProps, oldProps, domElement);
  removeOldProps(newProps, oldProps, domElement);
}

export { updateTextNode, updateDOM };
export type { DOMElement } from './types';
