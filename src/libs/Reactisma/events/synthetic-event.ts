export interface SyntheticEvent<T extends Event = Event> {
  readonly nativeEvent: T;
  readonly type: string;
  readonly target: EventTarget | null;
  currentTarget: EventTarget | null;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly defaultPrevented: boolean;
  isPropagationStopped: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export function createSyntheticEvent<T extends Event>(
  native: T,
  currentTarget: EventTarget | null
): SyntheticEvent<T> {
  let propagationStopped = false;
  const event: SyntheticEvent<T> = {
    nativeEvent: native,
    type: native.type,
    target: native.target,
    currentTarget,
    bubbles: native.bubbles,
    cancelable: native.cancelable,
    get defaultPrevented() {
      return native.defaultPrevented;
    },
    get isPropagationStopped() {
      return propagationStopped;
    },
    set isPropagationStopped(value: boolean) {
      propagationStopped = value;
    },
    preventDefault: () => native.preventDefault(),
    stopPropagation: () => {
      propagationStopped = true;
      native.stopPropagation();
    },
  };
  return event;
}
