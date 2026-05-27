export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
export const sigmoidDerivative = (s: number): number => s * (1 - s);
export const tanh = Math.tanh;
export const tanhDerivative = (t: number): number => 1 - t * t;

/**
 * Numerically stable softmax: subtract the max BEFORE exponentiating to
 * prevent overflow for large logits.
 */
export function softmax(logits: Float32Array | number[], out?: Float32Array): Float32Array {
  const n = logits.length;
  const result = out ?? new Float32Array(n);
  let max = -Infinity;
  for (let i = 0; i < n; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const e = Math.exp(logits[i] - max);
    result[i] = e;
    sum += e;
  }
  const inv = 1 / sum;
  for (let i = 0; i < n; i++) result[i] *= inv;
  return result;
}

/**
 * Cross-entropy loss for one-hot targets:
 *   L = -sum(target * log(prob))
 * Uses a small epsilon to avoid log(0).
 */
export function crossEntropy(probs: Float32Array, target: Float32Array | number[]): number {
  let loss = 0;
  const eps = 1e-9;
  for (let i = 0; i < probs.length; i++) {
    if (target[i] !== 0) loss -= target[i] * Math.log(probs[i] + eps);
  }
  return loss;
}
