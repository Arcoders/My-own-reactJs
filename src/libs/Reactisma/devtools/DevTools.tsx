/** @jsx createElement */
import createElement from '../core/create-element';
import { useEffect, useRef, useState } from '../hooks';
import type { ComponentInstance, VNode } from '../core/types';

interface InspectorNode {
  name: string;
  uid: number;
  hooksSummary: string;
  propsPreview: string;
  children: InspectorNode[];
}

function summarizeHooks(instance: ComponentInstance): string {
  if (instance.hooks.length === 0) return '0 hooks';
  const counts: Record<string, number> = {};
  for (const h of instance.hooks) counts[h.type] = (counts[h.type] || 0) + 1;
  return Object.entries(counts)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
}

function previewProps(props: Record<string, unknown>): string {
  const summary: string[] = [];
  for (const key of Object.keys(props).slice(0, 4)) {
    if (key === 'children') continue;
    const v = props[key];
    if (typeof v === 'function') summary.push(`${key}: ƒ`);
    else if (typeof v === 'object' && v !== null) summary.push(`${key}: {…}`);
    else summary.push(`${key}: ${JSON.stringify(v)?.slice(0, 24) ?? ''}`);
  }
  return summary.join(', ') || '(no props)';
}

function walkInstanceTree(node: Node): InspectorNode | null {
  if (!(node instanceof Element)) return null;
  const instance = node.__$componentInstance;
  if (!instance) {
    const subroots: InspectorNode[] = [];
    for (const child of Array.from(node.childNodes)) {
      const result = walkInstanceTree(child);
      if (result) subroots.push(result);
    }
    if (subroots.length === 1) return subroots[0];
    if (subroots.length === 0) return null;
    return {
      name: '(host)',
      uid: -1,
      hooksSummary: '',
      propsPreview: '',
      children: subroots,
    };
  }

  const children: InspectorNode[] = [];
  for (const child of Array.from(node.childNodes)) {
    const result = walkInstanceTree(child);
    if (result) children.push(result);
  }
  return {
    name: instance.type.displayName || instance.type.name || 'Anonymous',
    uid: instance.uid,
    hooksSummary: summarizeHooks(instance),
    propsPreview: previewProps(instance.props as Record<string, unknown>),
    children,
  };
}

function renderTree(node: InspectorNode, depth = 0): VNode[] {
  const indent = '  '.repeat(depth);
  const line = createElement(
    'div',
    { style: { fontFamily: 'ui-monospace, monospace', fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre' } },
    `${indent}<${node.name}> `,
    createElement(
      'span',
      { style: { color: '#9aa0a6' } },
      node.uid >= 0 ? `#${node.uid} · ${node.hooksSummary} · ${node.propsPreview}` : ''
    )
  );
  const rows: VNode[] = [line];
  for (const child of node.children) rows.push(...renderTree(child, depth + 1));
  return rows;
}

const DevTools = () => {
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const rootRef = useRef<Element | null>(null);

  useEffect(() => {
    rootRef.current = document.getElementById('root');
    if (!open) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, [open]);

  if (!open) {
    return createElement(
      'button',
      {
        onClick: () => setOpen(true),
        style: {
          position: 'fixed',
          right: '12px',
          bottom: '12px',
          zIndex: '99999',
          background: '#1a1a1a',
          color: 'white',
          border: 'none',
          borderRadius: '999px',
          padding: '8px 14px',
          fontSize: '12px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          cursor: 'pointer',
        },
      },
      'devtools'
    );
  }

  const root = rootRef.current ?? document.getElementById('root');
  const tree = root ? walkInstanceTree(root) : null;
  const treeNode: InspectorNode = tree ?? {
    name: '(empty)',
    uid: -1,
    hooksSummary: '',
    propsPreview: '',
    children: [],
  };

  return createElement(
    'div',
    {
      style: {
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        zIndex: '99999',
        width: '420px',
        maxHeight: '60vh',
        overflow: 'auto',
        background: '#0d0f12',
        color: '#e6e6e6',
        border: '1px solid #2a2d33',
        borderRadius: '10px',
        padding: '10px 12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      },
    },
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '12px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#9aa0a6',
        },
      },
      'Reactisma DevTools',
      createElement(
        'button',
        {
          onClick: () => setOpen(false),
          style: {
            background: 'transparent',
            color: '#9aa0a6',
            border: '1px solid #2a2d33',
            borderRadius: '6px',
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: '11px',
          },
        },
        'close'
      )
    ),
    ...renderTree(treeNode)
  );
};

(DevTools as { displayName?: string }).displayName = 'DevTools';

export default DevTools;
