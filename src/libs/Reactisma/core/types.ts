export interface VNode {
  type: string | FunctionComponent;
  props: Record<string, unknown> & { children?: VNode[] };
  children: VNode[];
}

export type FunctionComponent<P extends Record<string, unknown> = Record<string, unknown>> = (props: P) => VNode;

export type Hook =
  | { type: 'state'; state: unknown }
  | { type: 'ref'; current: unknown }
  | { type: 'effect'; dependencies?: unknown[]; cleanup?: () => void }
  | { type: 'callback'; callback: unknown ; dependencies?: unknown[] };

export class ComponentInstance<P extends Record<string, unknown> = Record<string, unknown>> {
  type: FunctionComponent<P>;
  props: P;
  domNode: Node | null;
  hooks: Hook[];
  hookIndex: number;

  constructor(type: FunctionComponent<P>, props: P, domNode: Node | null) {
    this.type = type;
    this.props = props;
    this.domNode = domNode;
    this.hooks = [];
    this.hookIndex = 0;
  }
}

declare global {
  interface Node {
    __$virtualDOM?: VNode;
    __$componentInstance?: ComponentInstance;
  }
}