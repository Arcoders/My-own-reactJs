export const randomMatrix = (rows: number, cols: number, min: number, max: number): number[][] =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() * (max - min) + min)
    );
  
export const randomArray = (len: number, min: number, max: number): number[] =>
    Array.from({ length: len }, () => Math.random() * (max - min) + min);