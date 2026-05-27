import type { PropHandler } from '../types';

export const showHandler: PropHandler<unknown> = {
  set(el, value) {
    el.style.display = value ? '' : 'none';
  },
  cleanup(el) {
    el.style.removeProperty('display');
  },
};
