import type { PropHandler } from '../types';

type StyleValue = Record<string, string | number> | string;

export const styleHandler: PropHandler<StyleValue> = {
  set(el, value, oldValue) {
    if (typeof value === 'string') {
      el.setAttribute('style', value);
      return;
    }

    if (typeof value !== 'object' || value === null) return;

    if (typeof oldValue === 'object' && oldValue !== null) {
      for (const key in oldValue) {
        if (!(key in value)) el.style.removeProperty(toCssVar(key));
      }
    }

    for (const key in value) {
      const v = value[key];
      el.style.setProperty(toCssVar(key), v == null ? '' : String(v));
    }
  },
  cleanup(el) {
    el.removeAttribute('style');
  },
};

/**
 * camelCase → kebab-case so that `el.style.setProperty` accepts properties
 * like `backgroundColor` (`background-color`) or `webkitBackdropFilter`.
 */
function toCssVar(key: string): string {
  if (key.startsWith('--')) return key;
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
