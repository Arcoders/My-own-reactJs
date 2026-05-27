import type { Emotion, MemoryExample } from '../types';
import { LSHIndex } from './lsh';
import { clearAll, getAll, migrateFromLocalStorage, putAll } from './indexedDbStore';

const LEGACY_STORAGE_KEY = 'emotional_memory_examples';

interface ScoredExample extends MemoryExample {
  score: number;
}

/**
 * Emotional memory store backed by an LSH index for sub-linear retrieval
 * plus IndexedDB for persistence (with one-shot migration from the legacy
 * localStorage blob).
 */
export class EmotionalMemory {
  private examples: MemoryExample[] = [];
  private maxSize: number;
  private index: LSHIndex<number>;
  private vectorLength: number;
  private loaded = false;

  constructor(maxSize = 50, vectorLength = 784) {
    this.maxSize = maxSize;
    this.vectorLength = vectorLength;
    this.index = new LSHIndex<number>(vectorLength, 8);
    this.loadAsync().catch(() => {});
  }

  async ready(): Promise<void> {
    await this.loadAsync();
  }

  add(input: number[], label: number, emotion: Emotion): void {
    const idx = this.examples.length;
    this.examples.push({ input: input.slice(), label, emotion });
    this.index.add(input, idx);
    if (this.examples.length > this.maxSize) {
      this.examples.shift();
      this.rebuildIndex();
    }
    void this.persist();
  }

  clear(): void {
    this.examples = [];
    this.index.clear();
    void clearAll();
  }

  size(): number {
    return this.examples.length;
  }

  private rebuildIndex(): void {
    this.index = new LSHIndex<number>(this.vectorLength, 8);
    for (let i = 0; i < this.examples.length; i++) this.index.add(this.examples[i].input, i);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return magA === 0 || magB === 0 ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  private emotionDistance(e1: Emotion, e2: Emotion): number {
    return (
      Math.abs(e1.density - e2.density) +
      Math.abs(e1.symmetry - e2.symmetry) +
      Math.abs(e1.complexity - e2.complexity)
    ) / 3;
  }

  private computeScore(
    example: MemoryExample,
    query: number[],
    queryEmotion: Emotion,
    emotionWeight: number
  ): number {
    const visualSim = this.cosineSimilarity(query, example.input);
    const emotionSim = 1 - this.emotionDistance(queryEmotion, example.emotion);
    return (1 - emotionWeight) * visualSim + emotionWeight * emotionSim;
  }

  retrieve(query: number[], queryEmotion: Emotion, k = 3, emotionWeight = 0.3): MemoryExample[] {
    if (this.examples.length === 0) return [];
    const candidates = this.index.query(query);
    const indicesToScore =
      candidates.length >= k ? Array.from(new Set(candidates)) : Array.from(this.examples.keys());
    const scored: ScoredExample[] = indicesToScore.map((idx) => ({
      ...this.examples[idx],
      score: this.computeScore(this.examples[idx], query, queryEmotion, emotionWeight),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  memoryProb(
    query: number[],
    queryEmotion: Emotion,
    k = 3,
    emotionWeight = 0.3
  ): number[] | null {
    const neighbors = this.retrieve(query, queryEmotion, k, emotionWeight) as ScoredExample[];
    if (neighbors.length === 0) return null;
    const probs = new Array(10).fill(0);
    for (const n of neighbors) probs[n.label] += n.score;
    const total = probs.reduce((a, b) => a + b, 0);
    return total ? probs.map((p) => p / total) : null;
  }

  private async persist(): Promise<void> {
    try {
      await putAll(this.examples);
    } catch {
      /* ignore */
    }
  }

  private async loadAsync(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    const migrated = await migrateFromLocalStorage<MemoryExample>(LEGACY_STORAGE_KEY);
    if (migrated.length > 0) {
      this.examples = migrated.slice(-this.maxSize);
    } else {
      this.examples = (await getAll<MemoryExample>()).slice(-this.maxSize);
    }
    this.rebuildIndex();
  }
}
