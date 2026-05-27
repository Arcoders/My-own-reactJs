/**
 * Mini-parser for CSS-in-JS template strings. Supports a single level of
 * nesting via `&`, plus `@media` / `@supports` / `@keyframes` / `@font-face`
 * top-level at-rules. That covers virtually every real-world styled-component
 * usage. Deeper nesting can be lifted into siblings.
 */

export interface NestedBlock {
  selector: string;
  declarations: string;
}

export interface ParsedCss {
  rootDeclarations: string;
  nestedBlocks: NestedBlock[];
}

/**
 * Split a CSS chunk into (root-level declarations, nested blocks). Brace
 * matching is depth-aware so `@media (min-width: 600px) { ... }` survives
 * even when its body contains nested rules.
 */
export function parseCss(input: string): ParsedCss {
  const blocks: NestedBlock[] = [];
  let remaining = input;

  // Strip nested blocks one at a time so we don't have to track the whole
  // ranges; the outer string mutates downward as we splice each block out.
  while (true) {
    const openBrace = remaining.indexOf('{');
    if (openBrace === -1) break;

    let depth = 1;
    let closeBrace = -1;
    for (let i = openBrace + 1; i < remaining.length; i++) {
      const ch = remaining[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          closeBrace = i;
          break;
        }
      }
    }
    if (closeBrace === -1) break; // unterminated; bail out

    // Find where the selector starts: the last `;` or `}` before `{`.
    let selStart = 0;
    for (let i = openBrace - 1; i >= 0; i--) {
      const ch = remaining[i];
      if (ch === ';' || ch === '}') {
        selStart = i + 1;
        break;
      }
    }
    const selector = remaining.slice(selStart, openBrace).trim();
    const declarations = remaining.slice(openBrace + 1, closeBrace).trim();

    if (selector) {
      blocks.push({ selector, declarations });
    }

    remaining = remaining.slice(0, selStart) + remaining.slice(closeBrace + 1);
  }

  return {
    rootDeclarations: remaining.trim(),
    nestedBlocks: blocks,
  };
}

/**
 * Turn a parsed chunk into concrete `insertRule`-ready strings, anchored
 * on `className`. `&` is replaced with the base selector. `@media` and
 * `@supports` wrap the base selector. `@keyframes` and `@font-face` stand
 * alone (no `&` expansion makes sense for them).
 */
export function expandRules(className: string, parsed: ParsedCss): string[] {
  const rules: string[] = [];
  const base = `.${className}`;

  if (parsed.rootDeclarations) {
    rules.push(`${base} { ${parsed.rootDeclarations} }`);
  }

  for (const { selector, declarations } of parsed.nestedBlocks) {
    if (selector.startsWith('@media') || selector.startsWith('@supports')) {
      rules.push(`${selector} { ${base} { ${declarations} } }`);
    } else if (selector.startsWith('@keyframes') || selector.startsWith('@font-face')) {
      rules.push(`${selector} { ${declarations} }`);
    } else if (selector.includes('&')) {
      // Replace `&` with the base selector. Supports `&:hover`, `&::before`,
      // `& > .child`, comma-separated lists like `&:hover, &:focus`, etc.
      const expanded = selector
        .split(',')
        .map((part) => part.trim().replace(/&/g, base))
        .join(', ');
      rules.push(`${expanded} { ${declarations} }`);
    } else {
      // Descendant selector (e.g., `span` inside a styled component).
      rules.push(`${base} ${selector} { ${declarations} }`);
    }
  }

  return rules;
}
