import type { PropHandler } from '../types';

type Payload = { __html: string };

function isPayload(value: unknown): value is Payload {
  return typeof value === 'object' && value !== null && '__html' in value;
}

export const dangerouslySetInnerHTMLHandler: PropHandler<Payload> = {
  set(el, value) {
    if (isPayload(value)) el.innerHTML = value.__html;
  },
  cleanup(el) {
    el.innerHTML = '';
  },
};
