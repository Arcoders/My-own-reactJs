export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
export const sigmoidDerivative = (s: number): number => s * (1 - s);
export const tanh = Math.tanh;
export const tanhDerivative = (t: number): number => 1 - t * t;