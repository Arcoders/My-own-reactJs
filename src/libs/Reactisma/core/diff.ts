import mountElement from './mount-element';
import { updateDOM, updateTextNode } from '../dom';
import { setCurrentlyRenderingInstance } from '../hooks';
import { ComponentInstance, type VNode, type FunctionComponent } from './types';
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

  const children = virtualDOM.children || [];
  children.forEach((child, i) => {
    diff(child, oldDOM, oldDOM.childNodes[i]);
  });

  const oldChildNodes = oldDOM.childNodes;
  const newChildrenCount = children.length;
  while (oldChildNodes.length > newChildrenCount) {
    const extraNode = oldChildNodes[oldChildNodes.length - 1];
    unmount(extraNode);
    oldDOM.removeChild(extraNode);
  }

  return oldDOM;
}

function diffComponent(virtualDOM: VNode, container: Node, oldDOM: Node | null): Node {
  const componentFn = virtualDOM.type as FunctionComponent;
  const props = virtualDOM.props;

  let instance: ComponentInstance;
  if (oldDOM && oldDOM.__$componentInstance) {
    instance = oldDOM.__$componentInstance;
    instance.props = props;
  } else {
    instance = new ComponentInstance(componentFn, props, null);
  }

  setCurrentlyRenderingInstance(instance);
  instance.hookIndex = 0;

  const childVdom = componentFn(props);
  const newDOM = diff(childVdom, container, oldDOM);

  instance.domNode = newDOM;
  newDOM.__$componentInstance = instance;
  setCurrentlyRenderingInstance(null);

  return newDOM;
}

export default diff;