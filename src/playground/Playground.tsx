/** @jsx createElement */
import createElement from '../libs/Reactisma/core/create-element';
import { useState } from '../libs/Reactisma/hooks';
import { stories } from './stories';

const Playground = () => {
  const [active, setActive] = useState<string>(stories[0].id);
  const current = stories.find((s) => s.id === active) ?? stories[0];

  return createElement(
    'div',
    { style: { display: 'flex', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui, sans-serif' } },
    createElement(
      'nav',
      {
        style: {
          width: '220px',
          background: '#0d0f12',
          color: '#e6e6e6',
          padding: '16px',
          borderRight: '1px solid #1a1d22',
        },
      },
      createElement(
        'div',
        { style: { fontSize: '12px', textTransform: 'uppercase', color: '#9aa0a6', marginBottom: '12px' } },
        'Playground'
      ),
      ...stories.map((s) =>
        createElement(
          'button',
          {
            onClick: () => setActive(s.id),
            style: {
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: s.id === active ? '#1a1d22' : 'transparent',
              color: '#e6e6e6',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '4px',
              fontSize: '13px',
            },
          },
          s.title
        )
      )
    ),
    createElement(
      'main',
      { style: { flex: '1', background: '#f3f4f6' } },
      createElement(current.Component, {})
    )
  );
};

export default Playground;
