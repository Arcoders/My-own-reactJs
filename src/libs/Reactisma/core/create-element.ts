import type { VNode, VKey } from './types';

/**
 * `createElement` accepts any `(props: P) => VNode` (covariant escape via
 * `any` in the prop position; the renderer treats props opaquely anyway).
 * This avoids `as never` casts at every callsite when a component is typed
 * with stricter props than `Record<string, unknown>`.
 */
type AnyComponent = (props: any) => VNode; // eslint-disable-line @typescript-eslint/no-explicit-any

function flatten<T>(arr: T[]): T[] {
  return arr.reduce(
    (acc: T[], val) => (Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val)),
    []
  );
}

function isWhitespace(str: string): boolean {
  return /^\s*$/.test(str);
}

function normalizeKey(raw: unknown): VKey | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string' || typeof raw === 'number') return raw;
  return String(raw);
}

function createElement(
  type: string | AnyComponent,
  attributes: Record<string, unknown> | null = {},
  ...children: unknown[]
): VNode {
  const attrs = attributes ?? {};
  const flatChildren = flatten(children);
  const childElements: VNode[] = flatChildren.reduce((acc: VNode[], child) => {
    if (child == null || typeof child === 'boolean') return acc;
    if (typeof child === 'string' || typeof child === 'number') {
      const str = String(child);
      if (typeof child === 'string' && isWhitespace(str)) return acc;
      acc.push(createElement('text', { textContent: str }));
    } else if (typeof child === 'object' && child !== null && 'type' in child) {
      acc.push(child as VNode);
    }
    return acc;
  }, []);

  const { key: rawKey, ...restAttrs } = attrs as Record<string, unknown> & { key?: unknown };
  const key = normalizeKey(rawKey);

  return {
    type,
    key,
    children: childElements,
    props: Object.assign({ children: childElements }, restAttrs),
  };
}

export default createElement;
