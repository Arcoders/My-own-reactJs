import type { PropHandler } from '../types';

export const classNameHandler: PropHandler<string> = {
  set(el, value) {
    if (value) el.setAttribute('class', value);
    else el.removeAttribute('class');
  },
  cleanup(el) {
    el.removeAttribute('class');
  },
};
