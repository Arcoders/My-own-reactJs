import type { PropHandler } from '../types';

/**
 * Controlled-input props. Assigning to the DOM property (rather than the
 * attribute) is required so updates reflect immediately and round-trip
 * through `el.value` reads.
 */

export const valueHandler: PropHandler<string | number> = {
  set(el, value) {
    const str = value == null ? '' : String(value);
    if (el.value !== str) el.value = str;
  },
  cleanup(el) {
    el.value = '';
  },
};

export const checkedHandler: PropHandler<boolean> = {
  set(el, value) {
    el.checked = !!value;
  },
  cleanup(el) {
    el.checked = false;
  },
};

export const disabledHandler: PropHandler<boolean> = {
  set(el, value) {
    el.disabled = !!value;
  },
  cleanup(el) {
    el.disabled = false;
  },
};
