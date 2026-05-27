import { registerStyles } from './registry';

let kfCounter = 0;

/**
 * Adds a @keyframes block to the sheet and gives you back the name. You
 * use that name later inside `animation: ...`.
 *
 * The counter only goes up, which is more than we need (we never delete
 * keyframes), but keyframes are very small and this keeps the names
 * predictable.
 *
 * ```ts
 * const spin = keyframes`from { transform: rotate(0) } to { transform: rotate(360deg) }`;
 * const Spinner = styled.div`animation: ${spin} 1s linear infinite`;
 * ```
 */
export function keyframes(
  strings: TemplateStringsArray,
  ...values: Array<string | number>
): string {
  let body = '';
  for (let i = 0; i < strings.length; i++) {
    body += strings[i];
    if (i < values.length) body += String(values[i]);
  }
  const name = `kf-${++kfCounter}`;
  registerStyles(`@keyframes ${name} { ${body} }`);
  return name;
}
