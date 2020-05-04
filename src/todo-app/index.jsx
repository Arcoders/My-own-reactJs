import Reactisma from '../Reactisma'

export default (() => {
    /** @jsx  Reactisma.createElement */

    const root = document.getElementById('root')

    const BasicJSX = (
        <section className="container">
            <h1>Parcel can take any type of file as an entry point.</h1>
            <div>
                {typeof NaN === 'number' && <p>NaN is typeof number</p>} 
                {Array.isArray(1995) && <p>1995 is an array</p>}
            </div>
            <button onClick={() => window.open('parceljs.org', '_blank')}>Read more</button>
            <hr />
            Random text
        </section>
    )

    Reactisma.render(BasicJSX, root)

})()