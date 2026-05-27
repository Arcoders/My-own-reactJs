import type { FunctionComponent, VNode } from '../core/types';
import { SuspenseException } from './suspense';

interface LazyState<P extends Record<string, unknown>> {
  status: 'pending' | 'resolved' | 'rejected';
  promise: Promise<{ default: FunctionComponent<P> }>;
  result?: FunctionComponent<P>;
  error?: unknown;
}

/**
 * Code splitting with a friendly face. On the first render it throws a
 * promise, so the closest <Suspense> shows its fallback. Once the module
 * is loaded, the component renders as if it had always been there.
 *
 * We remember the loaded module at the module level, so if the component
 * is removed and added again, we do not download it twice.
 *
 * ```tsx
 * const HeavyChart = lazy(() => import('./HeavyChart'));
 * <Suspense fallback={<Spinner />}>
 *   <HeavyChart data={data} />
 * </Suspense>
 * ```
 */
export function lazy<P extends Record<string, unknown>>(
  loader: () => Promise<{ default: FunctionComponent<P> }>
): FunctionComponent<P> {
  let state: LazyState<P> | null = null;

  const Lazy: FunctionComponent<P> = (props) => {
    if (!state) {
      state = {
        status: 'pending',
        promise: loader().then(
          (mod) => {
            state!.status = 'resolved';
            state!.result = mod.default;
            return mod;
          },
          (err) => {
            state!.status = 'rejected';
            state!.error = err;
            throw err;
          }
        ),
      };
    }
    if (state.status === 'pending') throw new SuspenseException(state.promise);
    if (state.status === 'rejected') throw state.error;
    return (state.result as FunctionComponent<P>)(props) as VNode;
  };
  Lazy.displayName = 'Lazy';
  return Lazy;
}
