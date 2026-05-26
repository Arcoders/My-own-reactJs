/** @jsx Reactisma.createElement */
import Reactisma from './libs/Reactisma';

import App from './components/App';
import './App.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in index.html');
Reactisma.render(App, rootEl);