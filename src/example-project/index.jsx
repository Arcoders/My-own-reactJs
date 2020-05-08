import Reactisma from '../Reactisma'

export default (() => {
    /** @jsx  Reactisma.createElement */

    const root = document.getElementById('root')
    const JSX = (
        <section className="container">
            <h1>Parcel can take any type of file as an entry point.</h1>
            <div>
                {typeof NaN === 'number' && <p>NaN is typeof number</p>} 
                {Array.isArray(1995) && <p>1995 is an array</p>}
            </div>
            <button onClick={rerenderElement}>Rerender</button>
            <hr />
            Simple JSX
        </section>
    )

    Reactisma.render(JSX, root)

    function rerenderElement() {
        const RerenderJSX = (
            <section className="container">
                <h1>Parcel can take any type of file as an entry point.</h1>
                <div>
                    {typeof NaN === 'number' && <p>NaN is typeof number</p>} 
                    {Array.isArray('1995'.split('')) && <p>1995 is an array</p>}
                </div>
                <button>Reload</button>
                <hr />
                Rerender JSX 
            </section>
        )
        Reactisma.render(RerenderJSX, root)
    }

})()