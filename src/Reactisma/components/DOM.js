// TODO: Refactor using a better pattern

function updateTextNode(Node, newVirtualElement, oldVirtualElement) {
  if (
    newVirtualElement.props.textContent !== oldVirtualElement.props.textContent
  ) {
    Node.textContent = newVirtualElement.props.textContent;
  }
  Node.__$virtualDOM = newVirtualElement;
}

function evaluateEvent(propKey, newProp, oldProp, domElement) {
  if (!propKey.startsWith("on")) return;
  const event = propKey.toLowerCase().slice(2);
  domElement.addEventListener(event, newProp, false);
  oldProp && domElement.removeEventListener(event, oldProp, false);
  return true;
}

function evaluateInput(propKey, newProp, domElement) {
  if (propKey !== "value" || propKey !== "checked") return;
  domElement[propkey] = newProp;
  return true;
}

function evaluateClassName(propKey, newProp, domElement) {
  propKey === "className" && domElement.setAttribute("class", newProp);
  return true;
}

function evaluateChildren(propKey, newProp, domElement) {
  propKey !== "children" && domElement.setAttribute(propKey, newProp);
}

function evaluateOldEvent(propKey, oldProp, domElement) {
    if (!propKey.startsWith("on")) false
    const event = propKey.toLowerCase().slice(2)
    domElement.removeEventListener(event, oldProp, false)
    return true
}


function evaluateOldChildren(propKey) {
    propKey !== "children" && domElement.removeAttribute(propKey)
}

function updateProps(newProps, oldProps, domElement) {
  for (let [propKey, newProp] of Object.entries(newProps)) {
    const oldProp = oldProps[propKey];
    if (newProp !== oldProp) {
      evaluateEvent(propKey, newProp, oldProp, domElement) ||
        evaluateInput(propKey, newProp, domElement) ||
        evaluateClassName(propKey, newProp, domElement) ||
        evaluateChildren(propKey, newProp, domElement);
    }
  }
}

function removeOldProps(newProps, oldProps, domElement) {
  for (let [propKey, oldProp] of Object.entries(oldProps)) {
    const newProp = newProps[propKey];
    if (!newProp) {
      evaluateOldEvent(propKey, oldProp, domElement) || evaluateOldChildren(propKey)
    }
  }
}

function updateDOM(domElement, newVirtualElement, oldVirtualElement = {}) {
  const newProps = newVirtualElement.props || {};
  const oldProps = oldVirtualElement.props || {};
  updateProps(newProps, oldProps, domElement);
  removeOldProps(newProps, oldProps, domElement)
}

export { updateTextNode, updateDOM };
