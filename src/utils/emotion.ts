import type { Emotion } from '../types';

export function extractEmotion(input: number[]): Emotion {
  // Density
  const density = input.reduce((a, b) => a + b, 0) / input.length;

  // Symmetry
  let symSum = 0, symPairs = 0;
  for (let row = 0; row < 28; row++) {
    for (let col = 0; col < 14; col++) {
      const left = row * 28 + col;
      const right = row * 28 + (27 - col);
      symSum += Math.abs(input[left] - input[right]);
      symPairs++;
    }
  }
  const symmetry = 1 - symSum / symPairs;

  // Complexity
  let compSum = 0, compPairs = 0;
  for (let row = 0; row < 28; row++) {
    for (let col = 0; col < 27; col++) {
      const idx = row * 28 + col;
      compSum += Math.abs(input[idx] - input[idx + 1]);
      compPairs++;
    }
  }
  for (let col = 0; col < 28; col++) {
    for (let row = 0; row < 27; row++) {
      const idx = row * 28 + col;
      compSum += Math.abs(input[idx] - input[idx + 28]);
      compPairs++;
    }
  }
  const complexity = compSum / compPairs;

  return { density, symmetry, complexity };
}