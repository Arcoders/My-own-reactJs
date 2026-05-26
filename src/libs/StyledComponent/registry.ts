import { expandRules, parseCss } from './parser';

interface CacheEntry {
  className: string;
  ruleIndices: number[];
  refcount: number;
}

const cache = new Map<string, CacheEntry>();
let sheet: CSSStyleSheet | null = null;

function getSheet(): CSSStyleSheet {
  if (sheet) return sheet;
  if (typeof document === 'undefined') {
    // If there is no `document`, we are running on the server. The SSR
    // path goes through `extractCritical()`. If you see this error, then
    // something on the server forgot to use that helper.
    throw new Error('[styled] document is unavailable; SSR not yet supported');
  }
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-styled', 'reactisma');
  document.head.appendChild(styleEl);
  sheet = styleEl.sheet as CSSStyleSheet;
  return sheet;
}

// djb2 hash. It is not crypto, just a small and fast hash. The important
// thing is that it gives the same number every time for the same CSS, so the
// same style always gets the same class name. This helps a lot with snapshot
// tests and with SSR.
function hashString(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

// Returns a className that applies this CSS. If we have seen this CSS
// before, we just add one to the reference count and return the same name.
// There is no point inserting the same rule twice, and the browser is much
// happier this way.
export function registerStyles(cssString: string): string {
  const key = cssString.trim();
  if (!key) return '';

  const existing = cache.get(key);
  if (existing) {
    existing.refcount++;
    return existing.className;
  }

  const className = `rsx-${hashString(key)}`;
  const parsed = parseCss(key);
  const rules = expandRules(className, parsed);

  const target = getSheet();
  const indices: number[] = [];
  for (const rule of rules) {
    try {
      const idx = target.insertRule(rule, target.cssRules.length);
      indices.push(idx);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[styled] invalid CSS rule skipped:', rule, err);
    }
  }

  cache.set(key, { className, ruleIndices: indices, refcount: 1 });
  return className;
}

// Drops one reference. When the count reaches zero, we remove the rules
// from the sheet. The tricky part is that deleting a rule shifts every
// higher index down by one, so we have to fix the saved indices in every
// other entry too. If we forget this, we will delete the wrong rule next
// time.
export function releaseStyles(cssString: string): void {
  const key = cssString.trim();
  if (!key) return;
  const entry = cache.get(key);
  if (!entry) return;

  entry.refcount--;
  if (entry.refcount > 0) return;

  const target = getSheet();
  const sorted = [...entry.ruleIndices].sort((a, b) => b - a);
  for (const idx of sorted) {
    try {
      target.deleteRule(idx);
    } catch {
      /* ignore */
    }
    // Every other entry's indices > idx shift down by 1.
    for (const other of cache.values()) {
      if (other === entry) continue;
      other.ruleIndices = other.ruleIndices.map((i) => (i > idx ? i - 1 : i));
    }
  }
  cache.delete(key);
}

/**
 * Inserts raw CSS rules, like `body { ... }`, resets, or font-faces. No
 * `.rsx-X` wrapper around them, no scoping at all.
 *
 * It returns a handle (a symbol). You do not need to look inside it. Just
 * keep it around and pass it to `unregisterRawRules` later when you want
 * to remove these rules.
 */
export function registerRawRules(cssBody: string): symbol {
  const handle = Symbol('raw-rules');
  const parsed = parseCss(cssBody);
  const sheetObj = getSheet();
  const indices: number[] = [];

  // Top-level declarations without selectors are skipped (they would be
  // invalid as a rule without a selector).
  for (const block of parsed.nestedBlocks) {
    let rule: string;
    if (block.selector.startsWith('@media') || block.selector.startsWith('@supports')) {
      rule = `${block.selector} { ${block.declarations} }`;
    } else if (block.selector.startsWith('@keyframes') || block.selector.startsWith('@font-face')) {
      rule = `${block.selector} { ${block.declarations} }`;
    } else {
      // Real selector like `body`, `*`, `html, body`, `.foo`, etc.
      rule = `${block.selector} { ${block.declarations} }`;
    }
    try {
      const idx = sheetObj.insertRule(rule, sheetObj.cssRules.length);
      indices.push(idx);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[styled] invalid global rule skipped:', rule, err);
    }
  }

  rawRules.set(handle, indices);
  return handle;
}

export function unregisterRawRules(handle: symbol): void {
  const indices = rawRules.get(handle);
  if (!indices) return;
  const sheetObj = getSheet();
  const sorted = [...indices].sort((a, b) => b - a);
  for (const idx of sorted) {
    try {
      sheetObj.deleteRule(idx);
    } catch {
      /* ignore */
    }
    for (const other of cache.values()) {
      other.ruleIndices = other.ruleIndices.map((i) => (i > idx ? i - 1 : i));
    }
    for (const [h, arr] of rawRules) {
      if (h === handle) continue;
      rawRules.set(
        h,
        arr.map((i) => (i > idx ? i - 1 : i))
      );
    }
  }
  rawRules.delete(handle);
}

const rawRules = new Map<symbol, number[]>();

// Not a public API. Tests use it to check the reference counts, and one
// day the devtools could use it to draw a panel. Please do not import it
// from app code.
export function _peekStyles(): ReadonlyArray<{ key: string; className: string; refcount: number }> {
  return Array.from(cache, ([key, entry]) => ({
    key,
    className: entry.className,
    refcount: entry.refcount,
  }));
}
