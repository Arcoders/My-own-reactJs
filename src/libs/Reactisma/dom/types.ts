export type DOMElement = HTMLElement & {
  value?: string;
  checked?: boolean;
  disabled?: boolean;
};

export interface PropHandler<T = unknown> {
  /**
   * Apply `value` to `el`. `oldValue` is provided so handlers like event
   * listeners can remove the previous registration before adding the new one.
   */
  set(el: DOMElement, value: T, oldValue: T | undefined, propKey: string): void;

  /**
   * Revert whatever `set` did. Called when a prop is removed entirely from
   * the next render's props bag.
   */
  cleanup(el: DOMElement, oldValue: T, propKey: string): void;
}
