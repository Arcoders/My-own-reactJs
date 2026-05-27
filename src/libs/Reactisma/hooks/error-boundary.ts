import createElement from '../core/create-element';
import type { FunctionComponent, VNode } from '../core/types';
import { useState } from './hooks';

export type ErrorFallbackProps = {
  error: Error;
  reset: () => void;
} & Record<string, unknown>;

/**
 * Wrap a component so that any error thrown during its own render is
 * caught and routed to a `Fallback` component. Includes a `reset` callback
 * that clears the error and re-renders the wrapped component.
 *
 * Limitations:
 *   - Catches errors thrown during render of the WRAPPED component, not of
 *     its descendants. To extend that, you would need a try/catch in the
 *     reconciler itself (planned with the Fiber rewrite).
 *   - Does not catch async errors (promises, setTimeout, etc.). Use a
 *     try/catch + setError inside the async code instead.
 */
export function withErrorBoundary<P extends Record<string, unknown>>(
  Component: FunctionComponent<P>,
  Fallback: FunctionComponent<ErrorFallbackProps>
): FunctionComponent<P> {
  const Boundary: FunctionComponent<P> = (props) => {
    const [error, setError] = useState<Error | null>(null);

    if (error) {
      return createElement(Fallback as unknown as FunctionComponent, {
        error,
        reset: () => setError(null),
      });
    }

    try {
      return Component(props);
    } catch (raw) {
      const err = raw instanceof Error ? raw : new Error(String(raw));
      // Avoid setState during render; defer to the next tick.
      queueMicrotask(() => setError(err));
      return createElement(Fallback as unknown as FunctionComponent, {
        error: err,
        reset: () => setError(null),
      }) as VNode;
    }
  };
  Boundary.displayName = `withErrorBoundary(${Component.name || 'Component'})`;
  return Boundary;
}
