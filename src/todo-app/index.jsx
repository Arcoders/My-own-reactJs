import Reactisma from '../Reactisma'

console.log(Reactisma)
export default (() => {
    /** @jsx  Reactisma.createElement */

    const root = document.getElementById('root')

    const BasicJSX = (
        <section>
            <h1>Parcel can take any type of file as an entry point.</h1>
            <div>
                <p>
                    {typeof NaN === 'number' && <p>NaN is typeof number</p>} 
                    {Array.isArray(1995) && <p>1995 is an array</p>}
                </p>
            </div>
            <button onClick={() => window.open('parceljs.org', '_blank')}>Read more</button>
        </section>
    )

    console.log(BasicJSX)

})()