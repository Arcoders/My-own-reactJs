import pipeline from '../utils/pileline';
import type { VNode } from '../core/types';

type DOMElement = HTMLElement & {
  value?: string;
  checked?: boolean;
  disabled?: boolean;
};

function updateTextNode(
  node: Text,
  newVirtualElement: VNode,
  oldVirtualElement: VNode
): void {
  const newText = newVirtualElement.props.textContent as string | undefined;
  const oldText = oldVirtualElement.props.textContent as string | undefined;
  if (newText !== oldText) {
    node.textContent = newText ?? null;
  }
  node.__$virtualDOM = newVirtualElement;
}

const showProp = (
  next: () => void,
  propKey: string,
  newProp: unknown,
  domElement: DOMElement
) => {
  if (propKey === '$show') {
    domElement.style.display = newProp ? '' : 'none';
  } else {
    next();
  }
};

const refProp = (
  next: () => void,
  propKey: string,
  newProp: unknown,
  domElement: DOMElement
) => {
  if (propKey === 'ref') {
    if (newProp && typeof newProp === 'object' && 'current' in newProp) {
      (newProp as { current: DOMElement }).current = domElement;
    } else if (typeof newProp === 'function') {
      (newProp as (el: DOMElement) => void)(domElement);
    }
  } else {
    next();
  }
};

const styleProp = (
  next: () => void,
  propKey: string,
  newProp: unknown,
  domElement: DOMElement
) => {
  if (propKey === 'style') {
    if (typeof newProp === 'object') {
      Object.assign(domElement.style, newProp);
    } else if (typeof newProp === 'string') {
      domElement.setAttribute('style', newProp);
    }
  } else {
    next();
  }
};

const eventProp = (
  next: () => void,
  propKey: string,
  newProp: unknown,
  oldProp: unknown,
  domElement: DOMElement
) => {
  if (propKey.startsWith('on')) {
    const event = propKey.toLowerCase().slice(2);
    domElement.addEventListener(event, newProp as EventListener, false);
    if (oldProp) {
      domElement.removeEventListener(event, oldProp as EventListener, false);
    }
  } else {
    next();
  }
};

const inputProps = (
  next: () => void,
  propKey: string,
  newProp: unknown,
  domElement: DOMElement
) => {
  if (propKey === 'value') {
    domElement.value = newProp as string;
  } else if (propKey === 'checked') {
    domElement.checked = !!newProp;
  } else if (propKey === 'disabled') {
    domElement.disabled = !!newProp;
  } else {
    next();
  }
};

const classNameProp = (
  next: () => void,
  propKey: string,
  newProp: unknown,
  domElement: DOMElement
) => {
  if (propKey === 'className') {
    domElement.setAttribute('class', newProp as string);
  } else {
    next();
  }
};

const genericProp = (
  _next: () => void,
  propKey: string,
  newProp: unknown,
  domElement: DOMElement
) => {
  if (propKey !== 'children' && propKey !== 'ref') {
    domElement.setAttribute(propKey, String(newProp));
  }
};

function pipelineUpdateProps(
  propKey: string,
  newProp: unknown,
  oldProp: unknown,
  domElement: DOMElement
): void {
  const steps = [
    (next: () => void) => showProp(next, propKey, newProp, domElement),
    (next: () => void) => refProp(next, propKey, newProp, domElement),
    (next: () => void) => styleProp(next, propKey, newProp, domElement),
    (next: () => void) => eventProp(next, propKey, newProp, oldProp, domElement),
    (next: () => void) => inputProps(next, propKey, newProp, domElement),
    (next: () => void) => classNameProp(next, propKey, newProp, domElement),
    (next: () => void) => genericProp(next, propKey, newProp, domElement),
  ];

  steps.forEach(step => pipeline.use(step));
  pipeline.run();
  pipeline.clear();
}

const cleanRef = (
  next: () => void,
  propKey: string,
  oldProp: unknown,
) => {
  if (propKey === 'ref') {
    if (oldProp && typeof oldProp === 'object' && 'current' in oldProp) {
      (oldProp as { current: DOMElement | null }).current = null;
    } else if (typeof oldProp === 'function') {
      (oldProp as (el: DOMElement | null) => void)(null);
    }
  } else {
    next();
  }
};

const cleanStyle = (
  next: () => void,
  propKey: string,
  _oldProp: unknown,
  domElement: DOMElement
) => {
  if (propKey === 'style') {
    domElement.removeAttribute('style');
  } else {
    next();
  }
};

const cleanEvent = (
  next: () => void,
  propKey: string,
  oldProp: unknown,
  domElement: DOMElement
) => {
  if (propKey.startsWith('on')) {
    const event = propKey.toLowerCase().slice(2);
    domElement.removeEventListener(event, oldProp as EventListener, false);
  } else {
    next();
  }
};

const cleanInputProps = (
  next: () => void,
  propKey: string,
  _oldProp: unknown,
  domElement: DOMElement
) => {
  if (propKey === 'value') {
    domElement.value = '';
  } else if (propKey === 'checked') {
    domElement.checked = false;
  } else if (propKey === 'disabled') {
    domElement.disabled = false;
  } else {
    next();
  }
};

const cleanGeneric = (
  _next: () => void,
  propKey: string,
  _oldProp: unknown,
  domElement: DOMElement
) => {
  if (propKey !== 'children' && propKey !== 'ref') {
    domElement.removeAttribute(propKey);
  }
};

function pipelineCleanOldProps(
  propKey: string,
  oldProp: unknown,
  domElement: DOMElement
): void {
  const steps = [
    (next: () => void) => cleanRef(next, propKey, oldProp),
    (next: () => void) => cleanStyle(next, propKey, oldProp, domElement),
    (next: () => void) => cleanEvent(next, propKey, oldProp, domElement),
    (next: () => void) => cleanInputProps(next, propKey, oldProp, domElement),
    (next: () => void) => cleanGeneric(next, propKey, oldProp, domElement),
  ];

  steps.forEach(step => pipeline.use(step));
  pipeline.run();
  pipeline.clear();
}

function updateProps(
  newProps: Record<string, unknown>,
  oldProps: Record<string, unknown>,
  domElement: DOMElement
): void {
  for (const [propKey, newProp] of Object.entries(newProps)) {
    const oldProp = oldProps[propKey];
    if (newProp !== oldProp) {
      pipelineUpdateProps(propKey, newProp, oldProp, domElement);
    }
  }
}

function removeOldProps(
  newProps: Record<string, unknown>,
  oldProps: Record<string, unknown>,
  domElement: DOMElement
): void {
  for (const [propKey, oldProp] of Object.entries(oldProps)) {
    if (!(propKey in newProps)) {
      pipelineCleanOldProps(propKey, oldProp, domElement);
    }
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