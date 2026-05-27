declare namespace Reactisma {
  interface DOMAttributes {
    children?: unknown;
    dangerouslySetInnerHTML?: { __html: string };
    id?: string;
    className?: string;
    class?: string;
    style?: Record<string, string | number> | string;
    value?: string | number;
    checked?: boolean;
    disabled?: boolean;
    type?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    width?: number | string;
    height?: number | string;
    name?: string;
    placeholder?: string;
    title?: string;
    role?: string;
    tabIndex?: number;
    href?: string;
    target?: string;
    rel?: string;
    ref?: { current: unknown } | ((el: Element | null) => void);
    key?: string | number;
    onChange?: (e: Event) => void;
    onInput?: (e: Event) => void;
    onClick?: (e: Event) => void;
    onMouseDown?: (e: MouseEvent) => void;
    onMouseUp?: (e: MouseEvent) => void;
    onMouseMove?: (e: MouseEvent) => void;
    onMouseEnter?: (e: MouseEvent) => void;
    onMouseLeave?: (e: MouseEvent) => void;
    onFocus?: (e: FocusEvent) => void;
    onBlur?: (e: FocusEvent) => void;
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
    onSubmit?: (e: Event) => void;
    'aria-label'?: string;
    'aria-live'?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
    'aria-valuenow'?: number | string;
    'aria-valuemin'?: number | string;
    'aria-valuemax'?: number | string;
    htmlFor?: string;
    selected?: boolean;
    [key: `data-${string}`]: unknown;
  }

  interface InputHTMLAttributes extends DOMAttributes {
    value?: string | number;
    checked?: boolean;
    type?: string;
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
    h3: Reactisma.DOMAttributes;
    h4: Reactisma.DOMAttributes;
    p: Reactisma.DOMAttributes;
    canvas: Reactisma.DOMAttributes;
    a: Reactisma.DOMAttributes;
    ul: Reactisma.DOMAttributes;
    ol: Reactisma.DOMAttributes;
    li: Reactisma.DOMAttributes;
    form: Reactisma.DOMAttributes;
    section: Reactisma.DOMAttributes;
    article: Reactisma.DOMAttributes;
    header: Reactisma.DOMAttributes;
    footer: Reactisma.DOMAttributes;
    nav: Reactisma.DOMAttributes;
    main: Reactisma.DOMAttributes;
    aside: Reactisma.DOMAttributes;
    img: Reactisma.DOMAttributes;
    svg: Reactisma.DOMAttributes;
    path: Reactisma.DOMAttributes;
    select: Reactisma.DOMAttributes;
    option: Reactisma.DOMAttributes;
    textarea: Reactisma.DOMAttributes;
  }
}