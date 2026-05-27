import { updateDOM } from '../dom';
import { ComponentInstance, type VNode, type FunctionComponent } from './types';
import { isContextProvider, popProvider, setCurrentlyRenderingInstance } from '../hooks';
import {
  isSuspenseBoundary,
  popSuspenseBoundary,
  currentSuspenseBoundary,
  SuspenseException,
} from '../concurrent';

function mountElement(virtualDOM: VNode): Node {
  if (typeof virtualDOM.type === 'function') {
    return mountComponent(virtualDOM);
  }

  if (virtualDOM.type === 'text') {
    const textNode = document.createTextNode(virtualDOM.props.textContent as string);
    textNode.__$virtualDOM = virtualDOM;
    return textNode;
  }

  const element = document.createElement(virtualDOM.type as string);
  updateDOM(element, virtualDOM);
  element.__$virtualDOM = virtualDOM;

  const children = virtualDOM.children || [];
  children.forEach((child) => {
    const childNode = mountElement(child);
    element.appendChild(childNode);
  });

  return element;
}

function mountComponent(virtualDOM: VNode): Node {
  const componentFn = virtualDOM.type as FunctionComponent;
  const props = virtualDOM.props;

  const instance = new ComponentInstance(componentFn, props, null);
  setCurrentlyRenderingInstance(instance);
  instance.hookIndex = 0;

  const providerPushed = isContextProvider(componentFn);
  const boundaryPushed = isSuspenseBoundary(componentFn);

  let domNode: Node;
  try {
    const childVdom = componentFn(props);
    domNode = mountElement(childVdom);
  } catch (err) {
    if (providerPushed) popProvider();
    if (boundaryPushed) popSuspenseBoundary();
    setCurrentlyRenderingInstance(null);
    if (err instanceof SuspenseException) {
      const boundary = currentSuspenseBoundary();
      if (boundary) {
        boundary.notifyPending(err.promise);
        // Placeholder; the boundary's re-render will replace this subtree.
        return document.createComment('reactisma-suspended');
      }
    }
    throw err;
  }

  if (providerPushed) popProvider();
  if (boundaryPushed) popSuspenseBoundary();

  setCurrentlyRenderingInstance(null);
  domNode.__$componentInstance = instance;
  instance.domNode = domNode;

  return domNode;
}

export default mountElement;