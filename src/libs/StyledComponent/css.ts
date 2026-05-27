/**
 * Tagged-template helper for composing CSS fragments outside of `styled`.
 * Returns a plain string suitable for interpolation into another `styled`
 * template:
 *
 * ```ts
 * const shadow = css`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`;
 * const Card = styled.div`background: white; ${shadow}`;
 * ```
 */
export function css(
  strings: TemplateStringsArray,
  ...values: Array<string | number | null | undefined | false>
): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const v = values[i];
      if (v != null && v !== false) result += String(v);
    }
  }
  return result;
}
