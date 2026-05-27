import { useLayoutEffect } from './hooks';

type RefLike<T> = { current: T | null } | ((value: T | null) => void) | null | undefined;

/**
 * Mirrors React.useImperativeHandle: assign a custom value (typically an
 * object of methods) to the forwarded ref. The assignment runs in the
 * layout phase, so consumers reading the ref in their own layout effect
 * see the latest value before paint.
 */
export function useImperativeHandle<T>(
  ref: RefLike<T>,
  factory: () => T,
  dependencies?: unknown[]
): void {
  useLayoutEffect(() => {
    if (!ref) return;
    const value = factory();
    if (typeof ref === 'function') {
      ref(value);
      return () => ref(null);
    }
    ref.current = value;
    return () => {
      ref.current = null;
    };
  }, dependencies);
}
