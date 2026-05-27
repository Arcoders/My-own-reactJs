import { renderToString } from './render-to-string';
import { _peekStyles } from '../../StyledComponent/registry';
import type { FunctionComponent, VNode } from '../core/types';

export interface CriticalResult {
  html: string;
  css: string;
  classNames: string[];
}

/**
 * Renders the tree once, and then takes a snapshot of the StyledComponent
 * sheet on the way out. You get back the HTML and a CSS string that is
 * ready to put inside the document `<head>`.
 *
 * One thing I would like to fix: this snapshot is the WHOLE sheet, not
 * only the rules used by this render. For a static deploy this is fine,
 * because the first render fills the cache and the next ones reuse it.
 * A per-render tracker is on the list for after the fiber rewrite.
 */
// A closing `</style>` inside the CSS would escape from our `<style>` tag.
// One small regex fixes it. Boring, but important for safety.
function escapeForStyleTag(css: string): string {
  return css.replace(/<\/style>/gi, '<\\/style>');
}

export function extractCritical(component: FunctionComponent | VNode): CriticalResult {
  const html = renderToString(component);
  const entries = _peekStyles();
  const classNames = entries.map((e) => e.className);
  let css = '';
  if (typeof document !== 'undefined') {
    const sheet = document.querySelector('style[data-styled=reactisma]') as HTMLStyleElement | null;
    if (sheet?.sheet) {
      for (const rule of Array.from(sheet.sheet.cssRules)) css += rule.cssText + '\n';
    }
  }
  return { html, css: escapeForStyleTag(css), classNames };
}
