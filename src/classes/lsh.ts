import { randomNormal } from '../utils/random';

/**
 * A fast way to find vectors that look similar, using cosine.
 *
 * The idea: we cut the space with a few random planes. Each vector becomes
 * a small string of bits, one per plane, that says "on which side of that
 * plane am I?". Vectors that are close to each other end up with the same
 * bits most of the time, so we can group them in buckets and only compare
 * inside the same bucket.
 *
 * I picked this over a KD-tree because KD-trees stop being useful when the
 * vectors have many dimensions. The result here is approximate, not exact,
 * but that is fine for the emotional memory: we just want "give me a few
 * similar memories", not the perfect match.
 *
 * As a small safety net, we also look at buckets that are one bit away from
 * the query. That way, if the query sits very close to a plane, we still
 * find its neighbors on the other side.
 */
export class LSHIndex<T> {
  private buckets = new Map<string, T[]>();
  private planes: Float32Array[];
  private vectorLength: number;
  private size = 0;

  constructor(vectorLength: number, numPlanes = 8) {
    this.vectorLength = vectorLength;
    this.planes = Array.from({ length: numPlanes }, () => {
      const p = new Float32Array(vectorLength);
      for (let i = 0; i < vectorLength; i++) p[i] = randomNormal();
      return p;
    });
  }

  // Using a string as the key is a bit unusual, but it makes the next part
  // easy: to look at a "neighbor bucket" we just flip one character of the
  // string. The few extra bytes are worth it.
  private signature(vec: number[] | Float32Array): string {
    let sig = '';
    for (const plane of this.planes) {
      let dot = 0;
      for (let i = 0; i < this.vectorLength; i++) dot += plane[i] * (vec[i] as number);
      sig += dot >= 0 ? '1' : '0';
    }
    return sig;
  }

  add(vec: number[] | Float32Array, value: T): void {
    const sig = this.signature(vec);
    const bucket = this.buckets.get(sig);
    if (bucket) bucket.push(value);
    else this.buckets.set(sig, [value]);
    this.size++;
  }

  /**
   * Returns the matching bucket, plus every bucket that differs in only one
   * bit. With 8 planes that is at most 9 buckets, which is very cheap. It
   * saves us from missing good items only because the query happened to
   * land on the wrong side of one single plane.
   */
  query(vec: number[] | Float32Array): T[] {
    const sig = this.signature(vec);
    const hits: T[] = [];
    const main = this.buckets.get(sig);
    if (main) hits.push(...main);
    for (let i = 0; i < sig.length; i++) {
      const flipped = sig.slice(0, i) + (sig[i] === '0' ? '1' : '0') + sig.slice(i + 1);
      const bucket = this.buckets.get(flipped);
      if (bucket) hits.push(...bucket);
    }
    return hits;
  }

  count(): number {
    return this.size;
  }

  clear(): void {
    this.buckets.clear();
    this.size = 0;
  }
}
