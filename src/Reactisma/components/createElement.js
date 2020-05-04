function createElement(type, attributes = {}, ...children) {
    let childElements = [...children].reduce(
        (acc, child) => {
            if (typeof child === 'string') acc.push(createElement('text', {textContent: child}))
            if (child instanceof Object) acc.push(child)
            return acc;
        }
        , []);
    return {
        type,
        children: childElements,
        props: Object.assign({ children: childElements }, attributes)
    }
}

export default createElement