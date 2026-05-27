export type VKey = string | number;

export interface VNode {
  type: string | FunctionComponent;
  key?: VKey;
  props: Record<string, unknown> & { children?: VNode[] };
  children: VNode[];
}

/**
 * A component is just a function from props to VNode. Props are intentionally
 * loose at the type system level (`unknown` is the most accurate default
 * because the renderer only reads what the component reads).
 */
export type FunctionComponent<P = Record<string, unknown>> = ((props: P) => VNode) & {
  displayName?: string;
};

export type Hook =
  | { type: 'state'; state: unknown }
  | { type: 'ref'; current: unknown }
  | { type: 'effect'; dependencies?: unknown[]; cleanup?: () => void }
  | { type: 'layout-effect'; dependencies?: unknown[]; cleanup?: () => void }
  | { type: 'callback'; callback: unknown; dependencies?: unknown[] }
  | { type: 'memo'; value: unknown; dependencies?: unknown[] }
  | { type: 'id'; value: string };

let nextInstanceUid = 0;

export class ComponentInstance<P = Record<string, unknown>> {
  type: FunctionComponent<P>;
  props: P;
  domNode: Node | null;
  hooks: Hook[];
  hookIndex: number;
  uid: number;

  constructor(type: FunctionComponent<P>, props: P, domNode: Node | null) {
    this.type = type;
    this.props = props;
    this.domNode = domNode;
    this.hooks = [];
    this.hookIndex = 0;
    this.uid = ++nextInstanceUid;
  }
}

declare global {
  interface Node {
    __$virtualDOM?: VNode;
    __$componentInstance?: ComponentInstance;
  }
}