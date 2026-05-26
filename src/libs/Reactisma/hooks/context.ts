import type { FunctionComponent, VNode } from '../core/types';

export interface Context<T> {
  readonly _id: symbol;
  readonly _defaultValue: T;
  readonly Provider: FunctionComponent<{ value: T; children?: VNode | VNode[] }>;
}

interface ProviderFn extends FunctionComponent<{ value: unknown; children?: VNode | VNode[] }> {
  _isContextProvider?: true;
  _contextId?: symbol;
}

const providerStack: Array<{ id: symbol; value: unknown }> = [];

export function pushProvider(id: symbol, value: unknown): void {
  providerStack.push({ id, value });
}

export function popProvider(): void {
  providerStack.pop();
}

export function isContextProvider(fn: FunctionComponent): boolean {
  return (fn as ProviderFn)._isContextProvider === true;
}

export function getContextIdOf(fn: FunctionComponent): symbol | undefined {
  return (fn as ProviderFn)._contextId;
}

function readFromStack(id: symbol): { found: boolean; value: unknown } {
  for (let i = providerStack.length - 1; i >= 0; i--) {
    if (providerStack[i].id === id) return { found: true, value: providerStack[i].value };
  }
  return { found: false, value: undefined };
}

export function createContext<T>(defaultValue: T): Context<T> {
  const id = Symbol('context');

  const Provider: ProviderFn = (props) => {
    // The push happens here so that children rendered downstream see the value.
    // The matching pop runs in diffComponent / mountComponent after the subtree
    // is fully reconciled. See src/libs/Reactisma/core/mount-element.ts and diff.ts.
    pushProvider(id, props.value);
    const child = props.children;
    if (Array.isArray(child)) return (child[0] ?? emptyText()) as VNode;
    return (child as VNode) ?? emptyText();
  };
  Provider._isContextProvider = true;
  Provider._contextId = id;

  return {
    _id: id,
    _defaultValue: defaultValue,
    Provider: Provider as Context<T>['Provider'],
  };
}

export function useContext<T>(context: Context<T>): T {
  const result = readFromStack(context._id);
  return result.found ? (result.value as T) : context._defaultValue;
}

function emptyText(): VNode {
  return { type: 'text', props: { textContent: '' }, children: [] };
}
