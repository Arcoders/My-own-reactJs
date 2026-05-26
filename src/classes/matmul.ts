/**
 * Tiled matmul kernel used by hot loops inside DualBrainNN. The Wasm path
 * lands when the AssemblyScript toolchain is wired in (PR follow-up); the
 * default export is the JS implementation, which is the actual baseline
 * the M11 video benchmarks against.
 *
 * matMulVec(W, x, out, rows, cols): out = W @ x
 *   W is row-major (W[i*cols + j])
 *   x is length cols
 *   out is length rows (preallocated, will be overwritten)
 */
export function matMulVec(
  W: Float32Array,
  x: Float32Array,
  out: Float32Array,
  rows: number,
  cols: number
): void {
  const tile = 32;
  for (let i = 0; i < rows; i++) out[i] = 0;
  for (let i0 = 0; i0 < rows; i0 += tile) {
    const iEnd = Math.min(i0 + tile, rows);
    for (let j0 = 0; j0 < cols; j0 += tile) {
      const jEnd = Math.min(j0 + tile, cols);
      for (let i = i0; i < iEnd; i++) {
        let s = out[i];
        const rowBase = i * cols;
        for (let j = j0; j < jEnd; j++) {
          s += W[rowBase + j] * x[j];
        }
        out[i] = s;
      }
    }
  }
}

/**
 * Hook to plug in a WASM/SIMD implementation later without touching the
 * DualBrainNN. Default is the JS version; call `setMatMulImplementation`
 * after loading WASM to swap.
 */
let activeMatMul = matMulVec;
export function setMatMulImplementation(impl: typeof matMulVec): void {
  activeMatMul = impl;
}
export function getActiveMatMul(): typeof matMulVec {
  return activeMatMul;
}
