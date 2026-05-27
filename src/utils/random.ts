export const randomMatrix = (rows: number, cols: number, min: number, max: number): number[][] =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.random() * (max - min) + min)
  );

export const randomArray = (len: number, min: number, max: number): number[] =>
  Array.from({ length: len }, () => Math.random() * (max - min) + min);

/**
 * Box-Muller standard normal (mean 0, std 1). Used by initializer helpers.
 */
export function randomNormal(): number {
  const u1 = Math.random() || 1e-12;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Xavier (Glorot) initialization. Standard deviation `sqrt(2 / (fan_in + fan_out))`.
 * Pairs well with tanh / sigmoid activations.
 */
export function xavier(fanIn: number, fanOut: number): number {
  const std = Math.sqrt(2 / (fanIn + fanOut));
  return randomNormal() * std;
}

/**
 * He initialization. Standard deviation `sqrt(2 / fan_in)`. Pairs well with
 * ReLU-family activations.
 */
export function he(fanIn: number): number {
  return randomNormal() * Math.sqrt(2 / fanIn);
}

/**
 * Fill an existing Float32Array with values from a generator.
 */
export function fillTyped(arr: Float32Array, gen: () => number): Float32Array {
  for (let i = 0; i < arr.length; i++) arr[i] = gen();
  return arr;
}
