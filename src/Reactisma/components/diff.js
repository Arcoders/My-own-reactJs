import mountElement from './mountElement'
import {updateDOM, updateTextNode} from './DOM'

function diff(virtualDOM, container, oldDOM) {
    let oldvdom = oldDOM?.__$virtualDOM;

    if (!oldDOM) mountElement(virtualDOM, container, oldDOM)
    
    if (oldvdom?.type === virtualDOM.type) {
        (oldvdom.type === "text") 
            ? updateTextNode(oldDOM, virtualDOM, oldvdom) 
            : updateDOM(oldDOM, virtualDOM, oldvdom)

        oldDOM.__$virtualDOM = virtualDOM;
        virtualDOM.children.forEach((child, i) => diff(child, oldDOM, oldDOM.childNodes[i]))
    }
}

export default  diff