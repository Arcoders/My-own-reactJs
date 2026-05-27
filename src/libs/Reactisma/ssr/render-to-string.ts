import type { FunctionComponent, VNode } from '../core/types';
import { ComponentInstance } from '../core/types';
import { isContextProvider, popProvider, setCurrentlyRenderingInstance } from '../hooks';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr',
]);

const ESCAPE_HTML: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_HTML[ch] ?? ch);
}

function escapeAttrValue(input: string): string {
  return input.replace(/[&"]/g, (ch) => ESCAPE_HTML[ch] ?? ch);
}

function attrName(key: string): string | null {
  if (key === 'children' || key === 'key' || key === 'ref' || key === 'dangerouslySetInnerHTML') {
    return null;
  }
  if (key.startsWith('on') && key.length > 2 && key[2] >= 'A' && key[2] <= 'Z') return null;
  if (key === 'className') return 'class';
  return key;
}

function serializeProps(props: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key in props) {
    const v = props[key];
    if (v == null || v === false) continue;
    const name = attrName(key);
    if (!name) continue;
    if (key === 'style' && typeof v === 'object') {
      const styleStr = Object.entries(v as Record<string, string | number>)
        .map(([k, val]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${val}`)
        .join('; ');
      parts.push(`style="${escapeAttrValue(styleStr)}"`);
      continue;
    }
    if (v === true) {
      parts.push(name);
      continue;
    }
    parts.push(`${name}="${escapeAttrValue(String(v))}"`);
  }
  return parts.length === 0 ? '' : ' ' + parts.join(' ');
}

function serializeChildren(children: VNode[]): string {
  let out = '';
  for (const child of children) out += renderVNode(child);
  return out;
}

function renderComponent(vnode: VNode): string {
  const componentFn = vnode.type as FunctionComponent;
  const props = vnode.props;
  const instance = new ComponentInstance(componentFn, props, null);
  setCurrentlyRenderingInstance(instance);
  instance.hookIndex = 0;
  const providerPushed = isContextProvider(componentFn);
  const childVdom = componentFn(props);
  const html = renderVNode(childVdom);
  if (providerPushed) popProvider();
  setCurrentlyRenderingInstance(null);
  return html;
}

function renderVNode(vnode: VNode): string {
  if (typeof vnode.type === 'function') {
    return renderComponent(vnode);
  }
  if (vnode.type === 'text') {
    return escapeHtml(String(vnode.props.textContent ?? ''));
  }
  const tag = vnode.type as string;
  const props = vnode.props as Record<string, unknown>;
  const open = `<${tag}${serializeProps(props)}>`;
  if (VOID_ELEMENTS.has(tag)) return open;
  if (props.dangerouslySetInnerHTML && typeof props.dangerouslySetInnerHTML === 'object') {
    const html = (props.dangerouslySetInnerHTML as { __html?: string }).__html ?? '';
    return `${open}${html}</${tag}>`;
  }
  return `${open}${serializeChildren(vnode.children)}</${tag}>`;
}

/**
 * Server-side render a component to an HTML string. Effects don't run; hooks
 * that need browser APIs should guard for `typeof window`.
 */
export function renderToString(component: FunctionComponent | VNode): string {
  if (typeof component === 'function') {
    return renderVNode({ type: component, props: {}, children: [] });
  }
  return renderVNode(component);
}
