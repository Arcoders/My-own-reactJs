import { updateDOM } from '../dom';
import { ComponentInstance, type VNode, type FunctionComponent } from './types';
import { setCurrentlyRenderingInstance } from '../hooks';

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
  children.forEach(child => {
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

  const childVdom = componentFn(props);
  const domNode = mountElement(childVdom);

  setCurrentlyRenderingInstance(null);
  domNode.__$componentInstance = instance;
  instance.domNode = domNode;

  return domNode;
}

export default mountElement;