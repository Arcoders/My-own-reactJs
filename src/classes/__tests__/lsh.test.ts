import { describe, it, expect } from 'vitest';
import { LSHIndex } from '../lsh';

describe('LSHIndex', () => {
  it('adds and counts items', () => {
    const idx = new LSHIndex<number>(64, 4);
    for (let i = 0; i < 10; i++) {
      const v = new Float32Array(64);
      v[i] = 1;
      idx.add(v, i);
    }
    expect(idx.count()).toBe(10);
  });

  it('returns items in or near the query bucket', () => {
    const idx = new LSHIndex<number>(64, 4);
    for (let i = 0; i < 50; i++) {
      const v = new Float32Array(64);
      for (let j = 0; j < 64; j++) v[j] = Math.random();
      idx.add(v, i);
    }
    const probe = new Float32Array(64);
    for (let j = 0; j < 64; j++) probe[j] = Math.random();
    const hits = idx.query(probe);
    expect(hits.length).toBeGreaterThan(0);
    // Hamming-1 sweep over a 4-bit signature visits at most 5 buckets
    expect(hits.length).toBeLessThanOrEqual(50);
  });

  it('dedupes when the same vector is added twice', () => {
    const idx = new LSHIndex<string>(8, 4);
    const v = new Float32Array([1, 0, 1, 0, 1, 0, 1, 0]);
    idx.add(v, 'a');
    idx.add(v, 'a');
    const hits = idx.query(v);
    // Even if the vector is in multiple buckets, the same value 'a' appears once.
    expect(new Set(hits).size).toBe(hits.length);
  });

  it('clears state', () => {
    const idx = new LSHIndex<number>(8);
    idx.add(new Float32Array(8), 1);
    idx.clear();
    expect(idx.count()).toBe(0);
    expect(idx.query(new Float32Array(8))).toEqual([]);
  });
});
