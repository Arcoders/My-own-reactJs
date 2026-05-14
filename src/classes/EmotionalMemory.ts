import type { Emotion, MemoryExample } from '../types';

const STORAGE_KEY = 'emotional_memory_examples';

export class EmotionalMemory {
  private examples: MemoryExample[] = [];
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.loadFromStorage();
  }

  add(input: number[], label: number, emotion: Emotion): void {
    this.examples.push({ input: input.slice(), label, emotion });
    if (this.examples.length > this.maxSize) this.examples.shift();
    this.saveToStorage();
  }

  clear(): void {
    this.examples = [];
    this.saveToStorage();
  }

  size(): number {
    return this.examples.length;
  }

  private _cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return magA === 0 || magB === 0 ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  private _emotionDistance(e1: Emotion, e2: Emotion): number {
    return (Math.abs(e1.density - e2.density) +
            Math.abs(e1.symmetry - e2.symmetry) +
            Math.abs(e1.complexity - e2.complexity)) / 3;
  }

  private _computeScore(
    example: MemoryExample,
    query: number[],
    queryEmotion: Emotion,
    emotionWeight: number
  ): number {
    const visualSim = this._cosineSimilarity(query, example.input);
    const emotionSim = 1 - this._emotionDistance(queryEmotion, example.emotion);
    return (1 - emotionWeight) * visualSim + emotionWeight * emotionSim;
  }

  retrieve(query: number[], queryEmotion: Emotion, k = 3, emotionWeight = 0.3): MemoryExample[] {
    if (this.examples.length === 0) return [];
    const scored = this.examples.map(ex => ({
      ...ex,
      score: this._computeScore(ex, query, queryEmotion, emotionWeight)
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
    const neighbors = this.retrieve(query, queryEmotion, k, emotionWeight);
    if (neighbors.length === 0) return null;
    const probs = new Array(10).fill(0);
    for (const n of neighbors) probs[n.label] += (n as any).score;
    const total = probs.reduce((a, b) => a + b, 0);
    return total ? probs.map(p => p / total) : null;
  }

  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(this.examples);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.warn('Failed to save memory to localStorage', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const loaded = JSON.parse(serialized) as MemoryExample[];
        if (loaded.length > this.maxSize) {
          this.examples = loaded.slice(-this.maxSize);
        } else {
          this.examples = loaded;
        }
      }
    } catch (e) {
      console.warn('Failed to load memory from localStorage', e);
      this.examples = [];
    }
  }
}