import { setHandler, type SyntheticEvent } from '../../events';
import type { DOMElement, PropHandler } from '../types';

export function eventNameFromProp(propKey: string): string {
  return propKey.slice(2).toLowerCase();
}

export function isEventProp(propKey: string): boolean {
  return propKey.length > 2 && propKey.startsWith('on') && propKey[2] >= 'A' && propKey[2] <= 'Z';
}

type EventHandler = (event: SyntheticEvent) => void;

/**
 * Event props no longer call addEventListener directly. They register the
 * handler in `el.__$reactismaHandlers` and a single delegated listener on
 * the root reads from there. See src/libs/Reactisma/events/delegation.ts.
 */
export const eventHandler: PropHandler<EventHandler> = {
  set(el: DOMElement, value, _oldValue, propKey) {
    const eventType = eventNameFromProp(propKey);
    setHandler(el, eventType, typeof value === 'function' ? value : undefined);
  },
  cleanup(el, _oldValue, propKey) {
    setHandler(el, eventNameFromProp(propKey), undefined);
  },
};
