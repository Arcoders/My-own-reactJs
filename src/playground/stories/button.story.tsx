/** @jsx createElement */
import createElement from '../../libs/Reactisma/core/create-element';
import { Button, PrimaryButton } from '../../styles/styled';

const ButtonStory = () => {
  return createElement(
    'div',
    { style: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' } },
    createElement('h2', null, 'Button states'),
    createElement(
      'div',
      { style: { display: 'flex', gap: '12px' } },
      createElement(Button, null, 'default'),
      createElement(Button, { disabled: true }, 'disabled'),
      createElement(PrimaryButton, null, 'primary'),
      createElement(PrimaryButton, { disabled: true }, 'primary disabled')
    )
  );
};

export default ButtonStory;
