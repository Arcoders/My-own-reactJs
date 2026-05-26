import type { DOMElement, PropHandler } from '../types';

type RefObject = { current: DOMElement | null };
type RefCallback = (el: DOMElement | null) => void;
type RefValue = RefObject | RefCallback;

function isRefObject(value: unknown): value is RefObject {
  return typeof value === 'object' && value !== null && 'current' in value;
}

function isRefCallback(value: unknown): value is RefCallback {
  return typeof value === 'function';
}

export const refHandler: PropHandler<RefValue> = {
  set(el, value) {
    if (isRefObject(value)) {
      value.current = el;
    } else if (isRefCallback(value)) {
      value(el);
    }
  },
  cleanup(_el, oldValue) {
    if (isRefObject(oldValue)) {
      oldValue.current = null;
    } else if (isRefCallback(oldValue)) {
      oldValue(null);
    }
  },
};
