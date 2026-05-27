/** @jsx createElement */
import createElement from '../../libs/Reactisma/core/create-element';
import { useState, useEffect } from '../../libs/Reactisma/hooks';
import ActivationHeatmap from '../ActivationHeatmap';

const HeatmapStory = () => {
  const [values, setValues] = useState<number[]>(() =>
    Array.from({ length: 32 }, () => Math.random())
  );

  useEffect(() => {
    const id = setInterval(() => {
      setValues(Array.from({ length: 32 }, () => Math.random()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return createElement(
    'div',
    { style: { padding: '24px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' } },
    createElement('h2', null, 'ActivationHeatmap'),
    createElement('p', { style: { color: '#4f5b68' } }, 'Random activations refresh every second.'),
    createElement(ActivationHeatmap, { values, label: 'left', width: 320 }),
    createElement(ActivationHeatmap, { values: values.slice().reverse(), label: 'right', width: 320 }),
    createElement(ActivationHeatmap, { values: values.slice(0, 16), label: 'integration', width: 320 })
  );
};

export default HeatmapStory;
