import { describe, it, expect } from 'vitest';
import { matMulVec } from '../matmul';

describe('matMulVec', () => {
  it('computes a small 2x3 by 3 vector', () => {
    // W = [[1,2,3],[4,5,6]]; x = [1,2,3]; expected = [14, 32]
    const W = new Float32Array([1, 2, 3, 4, 5, 6]);
    const x = new Float32Array([1, 2, 3]);
    const out = new Float32Array(2);
    matMulVec(W, x, out, 2, 3);
    expect(Array.from(out)).toEqual([14, 32]);
  });

  it('handles non-tile-aligned dimensions', () => {
    const rows = 33;
    const cols = 65;
    const W = new Float32Array(rows * cols);
    const x = new Float32Array(cols);
    for (let i = 0; i < W.length; i++) W[i] = (i % 7) - 3;
    for (let j = 0; j < cols; j++) x[j] = (j % 5) - 2;

    const out = new Float32Array(rows);
    matMulVec(W, x, out, rows, cols);

    // Reference impl
    const ref = new Float32Array(rows);
    for (let i = 0; i < rows; i++) {
      let s = 0;
      for (let j = 0; j < cols; j++) s += W[i * cols + j] * x[j];
      ref[i] = s;
    }
    for (let i = 0; i < rows; i++) {
      expect(out[i]).toBeCloseTo(ref[i], 4);
    }
  });

  it('overwrites the out buffer (does not accumulate)', () => {
    const W = new Float32Array([1, 0, 0, 1]);
    const x = new Float32Array([1, 1]);
    const out = new Float32Array([999, 999]);
    matMulVec(W, x, out, 2, 2);
    expect(Array.from(out)).toEqual([1, 1]);
  });
});
