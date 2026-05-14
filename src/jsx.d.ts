declare namespace Reactisma {
    interface DOMAttributes {
      children?: unknown;
      dangerouslySetInnerHTML?: { __html: string };
      id?: string;
      className?: string;
      style?: Record<string, string | number>;
      value?: string | number;
      checked?: boolean;
      disabled?: boolean;
      type?: string;
      min?: number;
      max?: number;
      step?: number;
      onChange?: (e: Event) => void;
      'aria-live'?: string;
      htmlFor?: string;
      onClick?: (e: Event) => void;
    }
  
    interface InputHTMLAttributes extends DOMAttributes {
      value?: string;
    }
  
    type VNode = import('./libs/Reactisma/core/types').VNode;
    type ComponentInstance = import('./libs/Reactisma/core/types').ComponentInstance;
  }
  
  declare namespace JSX {
    type Element = Reactisma.VNode;
    type ElementClass = Reactisma.ComponentInstance;
    interface IntrinsicElements {
      div: Reactisma.DOMAttributes;
      span: Reactisma.DOMAttributes;
      label: Reactisma.DOMAttributes;
      button: Reactisma.DOMAttributes;
      input: Reactisma.InputHTMLAttributes;
      h1: Reactisma.DOMAttributes;
      h2: Reactisma.DOMAttributes;
      p: Reactisma.DOMAttributes;
      canvas: Reactisma.DOMAttributes;
    }
  }