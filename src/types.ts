export interface Emotion {
  density: number;
  symmetry: number;
  complexity: number;
}

export interface MemoryExample {
  input: number[];
  label: number;
  emotion: Emotion;
}

export interface Prediction {
  digit: number;
  probabilities: number[];
}

export interface NetworkForwardResult {
  leftHidden: number[];
  rightHidden: number[];
  concat: number[];
  integrate: number[];
  output: number[];
}
