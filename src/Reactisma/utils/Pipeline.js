function Middleware() {
    let middlewares = []
    const use = callback => middlewares.push(callback) 
    const run = (i = 0) => middlewares[i] && middlewares[i].call(null, () => run(i+1))
    const clear = () => (middlewares = [])
    return { run, use, clear}
}

export default Middleware()