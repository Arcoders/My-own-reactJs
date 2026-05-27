import type { DOMElement, PropHandler } from './types';
import {
  showHandler,
  refHandler,
  styleHandler,
  classNameHandler,
  eventHandler,
  isEventProp,
  valueHandler,
  checkedHandler,
  disabledHandler,
  dangerouslySetInnerHTMLHandler,
  attributeHandler,
} from './handlers';

const namedHandlers: Record<string, PropHandler> = {
  $show: showHandler as PropHandler,
  ref: refHandler as PropHandler,
  style: styleHandler as PropHandler,
  className: classNameHandler as PropHandler,
  class: classNameHandler as PropHandler,
  value: valueHandler as PropHandler,
  checked: checkedHandler as PropHandler,
  disabled: disabledHandler as PropHandler,
  dangerouslySetInnerHTML: dangerouslySetInnerHTMLHandler as PropHandler,
};

const RESERVED_PROPS = new Set(['children', 'textContent', 'key']);

function resolveHandler(propKey: string): PropHandler | null {
  if (RESERVED_PROPS.has(propKey)) return null;
  const named = namedHandlers[propKey];
  if (named) return named;
  if (isEventProp(propKey)) return eventHandler as PropHandler;
  return attributeHandler;
}

export function applyProp(
  el: DOMElement,
  propKey: string,
  newValue: unknown,
  oldValue: unknown
): void {
  const handler = resolveHandler(propKey);
  if (!handler) return;
  handler.set(el, newValue, oldValue, propKey);
}

export function cleanupProp(el: DOMElement, propKey: string, oldValue: unknown): void {
  const handler = resolveHandler(propKey);
  if (!handler) return;
  handler.cleanup(el, oldValue, propKey);
}
