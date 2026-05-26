import type { PropHandler } from '../types';

/**
 * Fallback handler for any prop not claimed by a specialized one
 * (data-*, aria-*, id, name, href, width, height, ...).
 *
 * Boolean attributes are converted by presence: `true` adds an empty
 * attribute, `false` / `null` / `undefined` removes it.
 */
export const attributeHandler: PropHandler<unknown> = {
  set(el, value, _oldValue, propKey) {
    if (value === false || value == null) {
      el.removeAttribute(propKey);
      return;
    }
    if (value === true) {
      el.setAttribute(propKey, '');
      return;
    }
    el.setAttribute(propKey, String(value));
  },
  cleanup(el, _oldValue, propKey) {
    el.removeAttribute(propKey);
  },
};
