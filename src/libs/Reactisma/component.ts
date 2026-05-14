import type { VNode, Hook } from './core/types';

export interface FunctionComponent<P = Record<string, unknown>> {
  (props: P): VNode;
}

export class ComponentInstance<P = Record<string, unknown>> {
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