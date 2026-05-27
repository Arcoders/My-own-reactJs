import mountElement from './mount-element';
import { updateDOM, updateTextNode } from '../dom';
import { isContextProvider, popProvider, setCurrentlyRenderingInstance } from '../hooks';
import {
  isSuspenseBoundary,
  popSuspenseBoundary,
  currentSuspenseBoundary,
  SuspenseException,
} from '../concurrent';
import { ComponentInstance, type VNode, type FunctionComponent, type VKey } from './types';
import { unmount } from './unmount';

function diff(virtualDOM: VNode, container: Node, oldDOM: Node | null): Node {
  if (typeof virtualDOM.type === 'function') {
    return diffComponent(virtualDOM, container, oldDOM);
  }

  if (!oldDOM) {
    const newDOM = mountElement(virtualDOM);
    container.appendChild(newDOM);
    return newDOM;
  }

  const oldvdom = oldDOM.__$virtualDOM;

  if (oldvdom?.type !== virtualDOM.type) {
    const newDOM = mountElement(virtualDOM);
    container.replaceChild(newDOM, oldDOM);
    unmount(oldDOM);
    return newDOM;
  }

  if (oldvdom?.type === 'text') {
    updateTextNode(oldDOM as Text, virtualDOM, oldvdom);
  } else {
    updateDOM(oldDOM as HTMLElement, virtualDOM, oldvdom);
  }
  oldDOM.__$virtualDOM = virtualDOM;

  reconcileChildren(oldDOM, virtualDOM.children || []);

  return oldDOM;
}

function diffComponent(virtualDOM: VNode, container: Node, oldDOM: Node | null): Node {
  const componentFn = virtualDOM.type as FunctionComponent;
  const props = virtualDOM.props;

  let instance: ComponentInstance;
  if (oldDOM && oldDOM.__$componentInstance && oldDOM.__$componentInstance.type === componentFn) {
    instance = oldDOM.__$componentInstance;
    instance.props = props;
  } else {
    instance = new ComponentInstance(componentFn, props, null);
  }

  setCurrentlyRenderingInstance(instance);
  instance.hookIndex = 0;

  const providerPushed = isContextProvider(componentFn);
  const boundaryPushed = isSuspenseBoundary(componentFn);

  let newDOM: Node;
  try {
    const childVdom = componentFn(props);
    newDOM = diff(childVdom, container, oldDOM);
  } catch (err) {
    if (providerPushed) popProvider();
    if (boundaryPushed) popSuspenseBoundary();
    setCurrentlyRenderingInstance(null);
    if (err instanceof SuspenseException) {
      const boundary = currentSuspenseBoundary();
      if (boundary) {
        boundary.notifyPending(err.promise);
        const placeholder = document.createComment('reactisma-suspended');
        if (oldDOM) container.replaceChild(placeholder, oldDOM);
        else container.appendChild(placeholder);
        return placeholder;
      }
    }
    throw err;
  }

  if (providerPushed) popProvider();
  if (boundaryPushed) popSuspenseBoundary();

  instance.domNode = newDOM;
  newDOM.__$componentInstance = instance;
  setCurrentlyRenderingInstance(null);

  return newDOM;
}

/**
 * Two ways to match new children with old ones.
 *
 * If any child has a `key`, we use the keyed version, which can move nodes
 * around without losing them. If no child has a key, we just pair them up
 * by position. The keyed path is what we want for lists that change order.
 * The old "by index only" code was the bug that started this whole rewrite,
 * so we check for keys first on purpose.
 */
function reconcileChildren(parent: Node, newChildren: VNode[]): void {
  const oldChildNodes = Array.from(parent.childNodes);

  let hasKeys = false;
  for (const c of newChildren) {
    if (c.key != null) {
      hasKeys = true;
      break;
    }
  }
  if (!hasKeys) {
    for (const n of oldChildNodes) {
      if (n.__$virtualDOM?.key != null) {
        hasKeys = true;
        break;
      }
    }
  }

  if (hasKeys) {
    reconcileByKey(parent, newChildren, oldChildNodes);
  } else {
    reconcileByIndex(parent, newChildren, oldChildNodes);
  }
}

function reconcileByIndex(parent: Node, newChildren: VNode[], oldChildNodes: Node[]): void {
  for (let i = 0; i < newChildren.length; i++) {
    diff(newChildren[i], parent, oldChildNodes[i] ?? null);
  }
  for (let i = oldChildNodes.length - 1; i >= newChildren.length; i--) {
    const extra = oldChildNodes[i];
    unmount(extra);
    if (extra.parentNode === parent) parent.removeChild(extra);
  }
}

function reconcileByKey(parent: Node, newChildren: VNode[], oldChildNodes: Node[]): void {
  const keyToNode = new Map<VKey, Node>();
  const unkeyed: Node[] = [];
  for (const node of oldChildNodes) {
    const k = node.__$virtualDOM?.key;
    if (k != null) keyToNode.set(k, node);
    else unkeyed.push(node);
  }

  let unkeyedIdx = 0;
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    let oldNode: Node | null = null;

    if (newChild.key != null) {
      oldNode = keyToNode.get(newChild.key) ?? null;
      if (oldNode) keyToNode.delete(newChild.key);
    } else {
      oldNode = unkeyed[unkeyedIdx++] ?? null;
    }

    const newDom = diff(newChild, parent, oldNode);

    const currentAtPosition = parent.childNodes[i];
    if (currentAtPosition !== newDom) {
      parent.insertBefore(newDom, currentAtPosition ?? null);
    }
  }

  for (const leftover of keyToNode.values()) {
    unmount(leftover);
    if (leftover.parentNode === parent) parent.removeChild(leftover);
  }
  for (let i = unkeyedIdx; i < unkeyed.length; i++) {
    const leftover = unkeyed[i];
    unmount(leftover);
    if (leftover.parentNode === parent) parent.removeChild(leftover);
  }
}

export default diff;
