import { useState } from './hooks';

export type Reducer<S, A> = (state: S, action: A) => S;
export type Dispatch<A> = (action: A) => void;

/**
 * useReducer is a thin layer over useState. Each `dispatch(action)` derives
 * the next state via `reducer(prev, action)` and forwards it to setState,
 * which handles the Object.is bailout and re-render scheduling.
 */
export function useReducer<S, A>(
  reducer: Reducer<S, A>,
  initialArg: S,
  init?: (initial: S) => S
): [S, Dispatch<A>] {
  const [state, setState] = useState<S>(() => (init ? init(initialArg) : initialArg));
  const dispatch: Dispatch<A> = (action) => {
    setState((prev) => reducer(prev, action));
  };
  return [state, dispatch];
}
