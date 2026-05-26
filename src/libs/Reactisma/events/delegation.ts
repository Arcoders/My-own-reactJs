import { createSyntheticEvent, type SyntheticEvent } from './synthetic-event';

type EventHandler = (event: SyntheticEvent) => void;

const HANDLERS_KEY = '__$reactismaHandlers';
const delegatedRoots = new WeakSet<Node>();

// The full list of events we listen to on the root. We add one listener
// per event type for the whole tree, instead of one listener per element.
// This saves a lot of memory on big trees, and it also means that props
// that change between renders cannot leak old listeners. If you add a new
// event here, JSX will see it automatically.
const DELEGATED_EVENT_TYPES = [
  'click',
  'dblclick',
  'change',
  'input',
  'submit',
  'reset',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'wheel',
  'contextmenu',
  'keydown',
  'keyup',
  'keypress',
  'focus',
  'blur',
  'focusin',
  'focusout',
  'touchstart',
  'touchmove',
  'touchend',
  'touchcancel',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointercancel',
  'pointerenter',
  'pointerleave',
] as const;

interface HandlerMap {
  [eventType: string]: EventHandler | undefined;
}

interface NodeWithHandlers extends Element {
  [HANDLERS_KEY]?: HandlerMap;
}

export function setHandler(el: Element, type: string, handler: EventHandler | undefined): void {
  const node = el as NodeWithHandlers;
  let map = node[HANDLERS_KEY];
  if (!map) {
    if (!handler) return;
    map = {};
    node[HANDLERS_KEY] = map;
  }
  if (handler) map[type] = handler;
  else delete map[type];
}

export function getHandler(el: Element, type: string): EventHandler | undefined {
  return (el as NodeWithHandlers)[HANDLERS_KEY]?.[type];
}

// Call this once per root. The WeakSet stops us from attaching twice if
// the same container is rendered again. That can happen during HMR or
// inside tests.
export function ensureRootListeners(root: Node): void {
  if (delegatedRoots.has(root)) return;
  delegatedRoots.add(root);

  for (const type of DELEGATED_EVENT_TYPES) {
    root.addEventListener(
      type,
      (native) => dispatchSynthetic(root, native),
      // Non-passive so handlers can call preventDefault (e.g. touchmove on canvas).
      { passive: false, capture: false }
    );
  }
}

function dispatchSynthetic(root: Node, native: Event): void {
  let node: Node | null = native.target as Node | null;
  if (!node) return;

  // We walk up to the root once. While we walk, we both build the path of
  // parents and check if any of them actually has a handler for this event.
  // If nobody does, and that is the common case for mousemove and
  // pointermove, we stop here before creating a synthetic event. This was
  // clearly visible in the profiler while dragging.
  const path: Element[] = [];
  let anyHandler = false;
  const type = native.type;
  while (node && node !== root) {
    if (node instanceof Element) {
      path.push(node);
      if (!anyHandler && getHandler(node, type) !== undefined) anyHandler = true;
    }
    node = node.parentNode;
  }
  if (!anyHandler || path.length === 0) return;

  const synthetic = createSyntheticEvent(native, path[0]);
  startBatching();
  try {
    for (const el of path) {
      synthetic.currentTarget = el;
      const handler = getHandler(el, type);
      if (!handler) continue;
      try {
        handler(synthetic);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[reactisma] handler threw:', err);
      }
      if (synthetic.isPropagationStopped) break;
    }
  } finally {
    endBatching();
  }
}

// --- Batching guard ----------------------------------------------------------
// Right now this only counts how deep we are, so other code can ask "are
// we inside an event?". The plan is to make setState join updates together
// while batchDepth is greater than 0. That is the same trick React uses,
// so that two setState calls inside the same handler only cause one render
// instead of two.

let batchDepth = 0;

export function startBatching(): void {
  batchDepth++;
}

export function endBatching(): void {
  batchDepth--;
}

export function isBatching(): boolean {
  return batchDepth > 0;
}
