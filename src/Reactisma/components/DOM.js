import Pipeline from '../utils/Pipeline'

function updateTextNode(Node, newVirtualElement, oldVirtualElement) {
  if (
    newVirtualElement.props.textContent !== oldVirtualElement.props.textContent
  ) {
    Node.textContent = newVirtualElement.props.textContent;
  }
  Node.__$virtualDOM = newVirtualElement;
}

function pipelineUpdateProps(propKey, newProp, oldProp, domElement) {
    Pipeline.use(next => {
        if (!propKey.startsWith("on")) return next()
        const event = propKey.toLowerCase().slice(2)
        domElement.addEventListener(event, newProp, false)
        oldProp && domElement.removeEventListener(event, oldProp, false)
      })
      
    Pipeline.use(next => {
        if (propKey !== "value" || propKey !== "checked") return next()
        domElement[propkey] = newProp;
    })
    
    Pipeline.use(next => {
        if (propKey !== "className") return next()
        domElement.setAttribute("class", newProp)
    })

    Pipeline.use(() => propKey !== "children" && domElement.setAttribute(propKey, newProp))

    Pipeline.run()
    Pipeline.clear()
}

function pipelineCleanOldProps(propKey, oldProp, domElement) {
    Pipeline.use(next => {
        if (!propKey.startsWith("on")) next()
        const event = propKey.toLowerCase().slice(2)
        domElement.removeEventListener(event, oldProp, false)
      })
      
    Pipeline.use(() => propKey !== "children" && domElement.removeAttribute(propKey))

    Pipeline.run()
    Pipeline.clear()
}

function updateProps(newProps, oldProps, domElement) {
  for (let [propKey, newProp] of Object.entries(newProps)) {
    const oldProp = oldProps[propKey]
    if (newProp !== oldProp) pipelineUpdateProps(propKey, newProp, oldProp, domElement)
  }
}

function removeOldProps(newProps, oldProps, domElement) {
  for (let [propKey, oldProp] of Object.entries(oldProps)) {
    const newProp = newProps[propKey]
    if (!newProp) pipelineCleanOldProps(propKey, oldProp, domElement)
  }
}

function updateDOM(domElement, newVirtualElement, oldVirtualElement = {}) {
  const newProps = newVirtualElement.props || {};
  const oldProps = oldVirtualElement.props || {};
  updateProps(newProps, oldProps, domElement);
  removeOldProps(newProps, oldProps, domElement)
}

export { updateTextNode, updateDOM };

