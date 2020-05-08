import {updateDOM} from './DOM'

function mountElement(virtualDOM, container, oldDOM) {
    mountSimpleNode(virtualDOM, container, oldDOM)
}

const createElementByType = {
    text: (virtualDOM) => document.createTextNode(virtualDOM.props.textContent),
    tag: (virtualDOM) =>  {
        const createdElement = document.createElement(virtualDOM.type)
        updateDOM(createdElement, virtualDOM)
        return createdElement
    },
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
    newElement.__$virtualDOM = virtualDOM;
    
    mountElementToContainer(container, newElement, oldDomElement?.nextSibling)
    virtualDOM.children.forEach(child => mountSimpleNode(child, newElement))
}

// function updateDOM(domElement, newVirtualElement, oldVirtualElement = {}) {
//     const newProps = newVirtualElement.props || {};
//     const oldProps = oldVirtualElement.props || {};
//     Object.keys(newProps).forEach(propName => {
//         const newProp = newProps[propName];
//         const oldProp = oldProps[propName];
//         if (newProp !== oldProp) {
//             if (propName.slice(0, 2) === "on") {
//                 // prop is an event handler
//                 const eventName = propName.toLowerCase().slice(2);
//                 domElement.addEventListener(eventName, newProp, false);
//                 if (oldProp) {
//                     domElement.removeEventListener(eventName, oldProp, false);
//                 }
//             } else if (propName === "value" || propName === "checked") {
//                 // this are special attributes that cannot be set
//                 // using setAttribute
//                 domElement[propName] = newProp;
//             } else if (propName !== "children") {
//                 // ignore the 'children' prop
//                 if (propName === "className") {
//                     domElement.setAttribute("class", newProps[propName]);
//                 } else {
//                     domElement.setAttribute(propName, newProps[propName]);
//                 }
//             }
//         }
//     });
//     // remove oldProps
//     Object.keys(oldProps).forEach(propName => {
//         const newProp = newProps[propName];
//         const oldProp = oldProps[propName];
//         if (!newProp) {
//             if (propName.slice(0, 2) === "on") {
//                 // prop is an event handler
//                 domElement.removeEventListener(propName, oldProp, false);
//             } else if (propName !== "children") {
//                 // ignore the 'children' prop
//                 domElement.removeAttribute(propName);
//             }
//         }
//     });
// }

// function updateTextNode(domElement, newVirtualElement, oldVirtualElement) {
//     if (newVirtualElement.props.textContent !== oldVirtualElement.props.textContent) {
//         domElement.textContent = newVirtualElement.props.textContent;
//     }
//     domElement.__$virtualDOM = newVirtualElement;
// }

// function diff(vdom, container, oldDom) {
//     let oldvdom = oldDom?.__$virtualDOM;

//     if (!oldDom) {
//         mountElement(vdom, container, oldDom);
//     }
//     else if (oldvdom?.type === vdom.type) {
//         if (oldvdom.type === "text") {
//             updateTextNode(oldDom, vdom, oldvdom);
//         } else {
//             updateDOM(oldDom, vdom, oldvdom);
//         }

//         oldDom.__$virtualDOM = vdom;

//         vdom.children.forEach((child, i) => {
//             diff(child, oldDom, oldDom.childNodes[i]);
//         });

//     }
// }

export default mountElement