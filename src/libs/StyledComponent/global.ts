import { useEffect } from '../Reactisma/hooks';
import type { FunctionComponent, VNode } from '../Reactisma/core/types';
import { registerRawRules, unregisterRawRules } from './registry';

/**
 * Create a component that, when mounted, injects the given CSS as truly
 * global rules (no className wrapper, no `&` substitution).
 *
 * ```ts
 * const GlobalReset = createGlobalStyle`
 *   * { box-sizing: border-box; }
 *   body { font-family: ui-sans-serif, system-ui, sans-serif; }
 * `;
 * <GlobalReset />
 * ```
 */
export function createGlobalStyle(
  strings: TemplateStringsArray,
  ...values: Array<string | number>
): FunctionComponent {
  let body = '';
  for (let i = 0; i < strings.length; i++) {
    body += strings[i];
    if (i < values.length) body += String(values[i]);
  }
  const GlobalStyle: FunctionComponent = () => {
    useEffect(() => {
      const handle = registerRawRules(body);
      return () => unregisterRawRules(handle);
    }, []);
    return { type: 'text', props: { textContent: '' }, children: [] } as VNode;
  };
  GlobalStyle.displayName = 'GlobalStyle';
  return GlobalStyle;
}
