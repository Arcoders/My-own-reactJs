import { runCleanupEffects } from '../hooks';

export function unmount(node: Node): void {
  if (!node) return;
  const instance = node.__$componentInstance;
  if (instance) {
    runCleanupEffects(instance);
  }
  Array.from(node.childNodes).forEach(child => unmount(child));
}