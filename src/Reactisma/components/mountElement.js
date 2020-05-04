function mountElement(virtualDOM, container, oldDOM) {
    mountSimpleNode(virtualDOM, container, oldDOM)
}

const createElementByType = {
    text: (virtualDOM) => document.createTextNode(virtualDOM.props.textContent),
    tag: (virtualDOM) =>  document.createElement(virtualDOM.type),
}

function mountElementToContainer(container, newElement, nextNode) {
    if (nextNode) return container.insertBefore(newElement, nextNode)
    container.appendChild(newElement)
}

function getElementType(type) {
    return type === 'text' ? type : 'tag'
} 

function mountSimpleNode(virtualDOM, container, oldDomElement) {
    const newElement = createElementByType[getElementType(virtualDOM.type)](virtualDOM)
    newElement.$$_virtualElement = virtualDOM;
    
    mountElementToContainer(container, newElement, oldDomElement?.nextSibling)
    virtualDOM.children.forEach(child => mountSimpleNode(child, newElement))
}


export default mountElement