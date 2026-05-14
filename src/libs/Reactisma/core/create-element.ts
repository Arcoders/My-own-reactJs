import type { VNode, FunctionComponent } from './types';

function flatten<T>(arr: T[]): T[] {
  return arr.reduce((acc: T[], val) => 
    Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);
}

function isWhitespace(str: string): boolean {
  return /^\s*$/.test(str);
}

function createElement(
  type: string | FunctionComponent,
  attributes: Record<string, unknown> = {},
  ...children: unknown[]
): VNode {
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

  return {
    type,
    children: childElements,
    props: Object.assign({ children: childElements }, attributes)
  };
}

export default createElement;