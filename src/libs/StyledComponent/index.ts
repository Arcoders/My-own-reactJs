import { createElement } from '../Reactisma/core';
import { useEffect, useRef } from '../Reactisma/hooks';
import type { FunctionComponent, VNode } from '../Reactisma/core/types';
import { registerStyles, releaseStyles } from './registry';
import { useTheme } from './theme';

export interface Theme {
  [key: string]: unknown;
}

let defaultTheme: Theme = {};

export const setTheme = (customTheme: Theme): void => {
  defaultTheme = customTheme;
};

export const getTheme = (): Theme => defaultTheme;

type BaseProps = {
  children?: VNode | VNode[] | null;
  style?: Record<string, string | number>;
  className?: string;
  [key: string]: unknown;
};

export type StyledProps<T> = T extends BaseProps ? T : T & BaseProps;

export type StyleValue<Props> =
  | string
  | number
  | boolean
  | null
  | undefined
  | ((props: Props & { theme: Theme }) => string | number | boolean | null | undefined);

export type StyledComponent<Props> = (props: StyledProps<Props>) => VNode;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type StyledTag<Props> = <ExtraProps extends Record<string, unknown> = {}>(
  strings: TemplateStringsArray,
  ...values: StyleValue<Props & ExtraProps>[]
) => StyledComponent<Props & ExtraProps>;

type AnyStyledTarget = string | ((props: never) => VNode);

type IntrinsicTags = {
  [K in keyof JSX.IntrinsicElements]: StyledTag<JSX.IntrinsicElements[K]>;
};

export type StyledFactory = (<Props extends Record<string, unknown> = Record<string, unknown>>(
  target: AnyStyledTarget
) => StyledTag<Props>) &
  IntrinsicTags;

function buildCssString<Props>(
  strings: TemplateStringsArray,
  values: StyleValue<Props>[],
  props: Props,
  theme: Theme
): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const v = values[i];
      const evaluated =
        typeof v === 'function'
          ? v({ ...(props as object), theme } as Props & { theme: Theme })
          : v;
      if (evaluated == null || evaluated === false) {
        // emit nothing for falsy interpolations
      } else {
        result += String(evaluated);
      }
    }
  }
  return result;
}

// The hook-side glue. It keeps one className alive while we need it, and
// drops it when the component is removed. Many components that share the
// same CSS will share one entry. That is the whole reason for the registry,
// otherwise we would be inserting the same rule into the page over and over.
function useStyleClass(cssString: string): string {
  const prevCssRef = useRef<string | null>(null);
  const classNameRef = useRef<string>('');

  if (prevCssRef.current !== cssString) {
    if (prevCssRef.current != null) releaseStyles(prevCssRef.current);
    classNameRef.current = registerStyles(cssString);
    prevCssRef.current = cssString;
  }

  useEffect(() => {
    return () => {
      if (prevCssRef.current != null) {
        releaseStyles(prevCssRef.current);
        prevCssRef.current = null;
      }
    };
  }, []);

  return classNameRef.current;
}

const prepareChildren = (children: unknown): VNode[] | null => {
  if (children == null) return null;
  if (Array.isArray(children)) return children as VNode[];
  return [children as VNode];
};

function joinClass(...parts: Array<string | undefined>): string | undefined {
  const filtered = parts.filter(Boolean);
  if (filtered.length === 0) return undefined;
  return filtered.join(' ');
}

const createStyledComponent = <Props>(target: AnyStyledTarget): StyledTag<Props> => {
  if (typeof target === 'string') {
    return ((strings, ...values) => {
      const styledFn: FunctionComponent = (props) => {
        const theme = useTheme();
        const cssString = buildCssString(strings, values, props as never, theme);
        const generatedClass = useStyleClass(cssString);
        const userClassName = (props as { className?: string }).className;
        const finalClass = joinClass(userClassName, generatedClass);

        const { className: _drop, ...rest } = props as Record<string, unknown> & {
          className?: string;
        };
        void _drop;

        return createElement(
          target,
          { ...rest, className: finalClass },
          prepareChildren(props.children as VNode | VNode[] | null | undefined)
        );
      };
      return styledFn as unknown as StyledComponent<Props>;
    }) as StyledTag<Props>;
  }

  const targetFn = target as FunctionComponent;
  return ((strings, ...values) => {
    const styledFn: FunctionComponent = (props) => {
      const theme = useTheme();
      const cssString = buildCssString(strings, values, props as never, theme);
      const generatedClass = useStyleClass(cssString);
      const userClassName = (props as { className?: string }).className;
      const finalClass = joinClass(userClassName, generatedClass);

      return createElement(
        targetFn,
        { ...(props as Record<string, unknown>), className: finalClass },
        prepareChildren(props.children as VNode | VNode[] | null | undefined)
      );
    };
    return styledFn as unknown as StyledComponent<Props>;
  }) as StyledTag<Props>;
};

function styled<Props extends Record<string, unknown> = Record<string, unknown>>(
  target: AnyStyledTarget
): StyledTag<Props> {
  return createStyledComponent<Props>(target);
}

const StyledComponent = new Proxy(styled, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== 'string') return undefined;
    return createStyledComponent<Record<string, unknown>>(prop);
  },
}) as unknown as StyledFactory;

export { ThemeProvider, ThemeContext, useTheme } from './theme';
export { keyframes } from './keyframes';
export { createGlobalStyle } from './global';
export { css } from './css';
export { registerStyles, releaseStyles, _peekStyles } from './registry';

export default StyledComponent;
