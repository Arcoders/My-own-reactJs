import mountElement from './mountElement'

function render(virtualDOM, container, oldDOM = container.firstChild) {
    if (!oldDOM) mountElement(virtualDOM, container, oldDOM)
}

export default render