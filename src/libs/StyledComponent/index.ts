import { createElement } from "../Reactisma/core";
import type { VNode, FunctionComponent } from "../Reactisma/core/types";
import { snakeToCamel } from './utils';
import { registerStyles } from './registry';


export interface Theme {
  [key: string]: unknown;
}

let defaultTheme: Theme = {};

export const setTheme = (customTheme: Theme): void => {
  defaultTheme = customTheme;
};

type BaseProps = {
  children?: VNode | VNode[] | null;
  style?: Record<string, string | number>;
  className?: string;
};

export type StyledProps<T> = T extends BaseProps ? T : T & BaseProps;

export type StyleValue<Props> =
  | string
  | number
  | ((props: Props & { theme: Theme }) => string | number);

export type StyledComponent<Props> = (props: StyledProps<Props>) => VNode;

export type StyledTag<Props> = (
  strings: TemplateStringsArray,
  ...values: StyleValue<Props>[]
) => StyledComponent<Props>;


function isDynamic<Props>(values: StyleValue<Props>[]): boolean {
  return values.some(v => typeof v === 'function');
}

function buildCssString(strings: TemplateStringsArray, values: string[]): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += values[i];
    }
  }
  return result;
}

function evaluateDynamicValues<Props>(
  values: StyleValue<Props>[],
  props: Props
): string[] {
  return values.map(v => {
    if (typeof v === 'function') {
      return String(v({ ...props, theme: defaultTheme }));
    }
    return String(v);
  });
}

function buildInlineStyleString(strings: TemplateStringsArray, evaluated: string[]): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < evaluated.length) {
      result += evaluated[i];
    }
  }
  return result;
}

function parseStyleString(styleString: string): Record<string, string | number> {
  const styles: Record<string, string | number> = {};
  const rules = styleString.split(';');
  for (const rule of rules) {
    const trimmed = rule.trim();
    if (!trimmed) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    const attribute = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    if (attribute && value) {
      styles[snakeToCamel(attribute)] = value;
    }
  }
  return styles;
}

function retrieveInlineStyles<Props>(
  props: Props,
  strings: TemplateStringsArray,
  values: StyleValue<Props>[]
): Record<string, string | number> {
  const evaluated = evaluateDynamicValues(values, props);
  const styleString = buildInlineStyleString(strings, evaluated);
  return parseStyleString(styleString);
}

const prepareHtmlProps = (props: Record<string, unknown>) => {
  const filtered: Record<string, unknown> = {};
  for (const key in props) {
    const value = props[key];
    if (typeof value !== 'boolean') {
      filtered[key] = value;
    }
  }
  return filtered;
};

const prepareChildren = (children: unknown): VNode[] | null => {
  if (children == null) return null;
  if (Array.isArray(children)) return children as VNode[];
  return [children as VNode];
};


const createStyledComponent = <Props>(
  target: string | FunctionComponent
): StyledTag<Props> => {
  if (typeof target === 'string') {
    return (strings, ...values) => (props) => {
      const children = prepareChildren(props.children);
      const htmlProps = prepareHtmlProps(props);
      const userClassName = htmlProps.className as string | undefined;

      if (isDynamic(values)) {
        const style = retrieveInlineStyles(props, strings, values);
        return createElement(target, { ...htmlProps, style }, children);
      } else {
        const staticValues = values.map(v => String(v));
        const cssString = buildCssString(strings, staticValues);
        const generatedClass = registerStyles(cssString);
        const finalClass = userClassName ? `${userClassName} ${generatedClass}` : generatedClass;

        const { className: _, ...restProps } = htmlProps;
        return createElement(target, { ...restProps, class: finalClass }, children);
      }
    };
  } else {
    return (strings, ...values) => (props) => {
      const hasDynamic = isDynamic(values);
      if (hasDynamic) {
        const styleFromProps = props.style ?? {};
        const computedStyle = retrieveInlineStyles(props, strings, values);
        const mergedStyle = { ...styleFromProps, ...computedStyle };
        return createElement(target, { ...props, style: mergedStyle }, props.children);
      } else {
        const staticValues = values.map(v => String(v));
        const cssString = buildCssString(strings, staticValues);
        const generatedClass = registerStyles(cssString);
        const combinedClass = props.className ? `${props.className} ${generatedClass}` : generatedClass;
        return createElement(target, { ...props, className: combinedClass }, props.children);
      }
    };
  }
};

function styled<Props>(
  target: string | FunctionComponent
): StyledTag<Props> {
  return createStyledComponent(target);
}

const StyledComponent = new Proxy(styled, {
  get(_target, prop: string) {
    return createStyledComponent<Record<string, unknown>>(prop);
  },
});

export default StyledComponent;