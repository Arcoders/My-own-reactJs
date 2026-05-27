import { afterEach } from 'vitest';

afterEach(() => {
  // Reset DOM and Reactisma stylesheet between tests
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});
