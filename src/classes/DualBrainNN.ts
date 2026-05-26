import { sigmoid, sigmoidDerivative, tanh, tanhDerivative, softmax } from '../utils/activations';
import { fillTyped, xavier } from '../utils/random';
import type { NetworkForwardResult } from '../types';

/**
 * Dual-brain net. Two halves (one with sigmoid, one with tanh) feed into a
 * middle layer, and then a softmax picks the answer.
 *
 * I switched to Float32Array for the weights because the old `number[][]`
 * was slow. Same math, but the CPU can load it much faster.
 *
 * For the output I used softmax with cross-entropy loss. The nice part is
 * that the gradient becomes just `probs - target`, so the code is short and
 * training actually learns. The old setup (MSE with sigmoid) was very slow
 * because the gradients almost died at 0 and 1.
 *
 * I also added Adam, L2, and dropout. Plain SGD with one fixed learning rate
 * kept either jumping around or getting stuck. The reused buffers at the top
 * of the class look noisy, but they save a lot of allocations per step.
 */

export interface AdamConfig {
  lr: number;
  beta1: number;
  beta2: number;
  epsilon: number;
}

const DEFAULT_ADAM: AdamConfig = { lr: 0.005, beta1: 0.9, beta2: 0.999, epsilon: 1e-8 };

interface AdamState {
  m: Float32Array;
  v: Float32Array;
}

function adamState(size: number): AdamState {
  return { m: new Float32Array(size), v: new Float32Array(size) };
}

export class DualBrainNN {
  readonly inputSize: number;
  readonly leftSize: number;
  readonly rightSize: number;
  readonly integrateSize: number;
  readonly outputSize: number;

  readonly opt: AdamConfig;
  readonly l2: number;
  readonly dropout: number;

  // Weights are stored row by row in one flat array. Row i starts at i*cols.
  // Keeping it flat is what makes it fast on the CPU.
  Wl: Float32Array; bl: Float32Array;
  Wr: Float32Array; br: Float32Array;
  Wi: Float32Array; bi: Float32Array;
  Wo: Float32Array; bo: Float32Array;

  // Adam needs two extra arrays for each weight matrix (m and v). It is what
  // it is, so we just keep them next to the weights.
  private mWl: AdamState; private mbl: AdamState;
  private mWr: AdamState; private mbr: AdamState;
  private mWi: AdamState; private mbi: AdamState;
  private mWo: AdamState; private mbo: AdamState;
  private step = 0;

  // Created once and reused on every step. It is a lot of fields, true, but
  // creating new arrays each time would make the garbage collector very busy.
  private bufLeft: Float32Array;
  private bufRight: Float32Array;
  private bufConcat: Float32Array;
  private bufInter: Float32Array;
  private bufLogits: Float32Array;
  private bufOut: Float32Array;
  private bufInput: Float32Array;
  private bufTarget: Float32Array;
  private bufDOut: Float32Array;
  private bufDInter: Float32Array;
  private bufDConcat: Float32Array;
  private bufDLeft: Float32Array;
  private bufDRight: Float32Array;
  private bufMaskL: Float32Array;
  private bufMaskR: Float32Array;
  private bufMaskI: Float32Array;

  constructor(
    inputSize: number,
    leftSize: number,
    rightSize: number,
    integrateSize: number,
    outputSize: number,
    options?: number | (Partial<AdamConfig> & { l2?: number; dropout?: number })
  ) {
    this.inputSize = inputSize;
    this.leftSize = leftSize;
    this.rightSize = rightSize;
    this.integrateSize = integrateSize;
    this.outputSize = outputSize;
    const opts = typeof options === 'number' ? { lr: options } : options ?? {};
    this.opt = { ...DEFAULT_ADAM, ...opts };
    this.l2 = opts.l2 ?? 1e-4;
    this.dropout = opts.dropout ?? 0;

    this.Wl = fillTyped(new Float32Array(leftSize * inputSize), () => xavier(inputSize, leftSize));
    this.bl = new Float32Array(leftSize);
    this.Wr = fillTyped(new Float32Array(rightSize * inputSize), () => xavier(inputSize, rightSize));
    this.br = new Float32Array(rightSize);
    this.Wi = fillTyped(
      new Float32Array(integrateSize * (leftSize + rightSize)),
      () => xavier(leftSize + rightSize, integrateSize)
    );
    this.bi = new Float32Array(integrateSize);
    this.Wo = fillTyped(new Float32Array(outputSize * integrateSize), () => xavier(integrateSize, outputSize));
    this.bo = new Float32Array(outputSize);

    this.mWl = adamState(this.Wl.length); this.mbl = adamState(this.bl.length);
    this.mWr = adamState(this.Wr.length); this.mbr = adamState(this.br.length);
    this.mWi = adamState(this.Wi.length); this.mbi = adamState(this.bi.length);
    this.mWo = adamState(this.Wo.length); this.mbo = adamState(this.bo.length);

    this.bufLeft = new Float32Array(leftSize);
    this.bufRight = new Float32Array(rightSize);
    this.bufConcat = new Float32Array(leftSize + rightSize);
    this.bufInter = new Float32Array(integrateSize);
    this.bufLogits = new Float32Array(outputSize);
    this.bufOut = new Float32Array(outputSize);
    this.bufInput = new Float32Array(inputSize);
    this.bufTarget = new Float32Array(outputSize);
    this.bufDOut = new Float32Array(outputSize);
    this.bufDInter = new Float32Array(integrateSize);
    this.bufDConcat = new Float32Array(leftSize + rightSize);
    this.bufDLeft = new Float32Array(leftSize);
    this.bufDRight = new Float32Array(rightSize);
    this.bufMaskL = new Float32Array(leftSize);
    this.bufMaskR = new Float32Array(rightSize);
    this.bufMaskI = new Float32Array(integrateSize);
  }

  private copyIntoInput(src: number[] | Float32Array): void {
    if (src instanceof Float32Array) {
      this.bufInput.set(src);
    } else {
      for (let i = 0; i < src.length; i++) this.bufInput[i] = src[i];
    }
  }

  private denseForward(
    W: Float32Array, b: Float32Array,
    inDim: number, outDim: number,
    x: Float32Array, out: Float32Array,
    act: (z: number) => number,
    mask: Float32Array | null
  ): void {
    for (let i = 0; i < outDim; i++) {
      let sum = b[i];
      const rowBase = i * inDim;
      for (let j = 0; j < inDim; j++) sum += W[rowBase + j] * x[j];
      out[i] = act(sum);
    }
    if (mask) {
      const scale = 1 / (1 - this.dropout);
      for (let i = 0; i < outDim; i++) {
        const keep = Math.random() >= this.dropout ? 1 : 0;
        mask[i] = keep;
        out[i] *= keep * scale;
      }
    }
  }

  /**
   * Forward pass. It returns views into the internal buffers, so please do
   * not write into them. If you need to keep the values, copy them first
   * with `Array.from` (that is what `forward()` does for you).
   */
  forwardTyped(input: number[] | Float32Array, train = false): {
    leftHidden: Float32Array;
    rightHidden: Float32Array;
    concat: Float32Array;
    integrate: Float32Array;
    output: Float32Array;
  } {
    this.copyIntoInput(input);
    const x = this.bufInput;

    this.denseForward(this.Wl, this.bl, this.inputSize, this.leftSize, x, this.bufLeft, sigmoid, train ? this.bufMaskL : null);
    this.denseForward(this.Wr, this.br, this.inputSize, this.rightSize, x, this.bufRight, tanh, train ? this.bufMaskR : null);

    this.bufConcat.set(this.bufLeft, 0);
    this.bufConcat.set(this.bufRight, this.leftSize);

    this.denseForward(
      this.Wi, this.bi,
      this.leftSize + this.rightSize, this.integrateSize,
      this.bufConcat, this.bufInter, sigmoid,
      train ? this.bufMaskI : null
    );

    for (let i = 0; i < this.outputSize; i++) {
      let sum = this.bo[i];
      const rowBase = i * this.integrateSize;
      for (let j = 0; j < this.integrateSize; j++) sum += this.Wo[rowBase + j] * this.bufInter[j];
      this.bufLogits[i] = sum;
    }
    softmax(this.bufLogits, this.bufOut);

    return {
      leftHidden: this.bufLeft,
      rightHidden: this.bufRight,
      concat: this.bufConcat,
      integrate: this.bufInter,
      output: this.bufOut,
    };
  }

  // Some older parts of the app still want number[]. We convert here, at the
  // edge, so the inside of the network stays fast. For new code, prefer
  // forwardTyped() and avoid the copy.
  forward(input: number[] | Float32Array, train = false): NetworkForwardResult {
    const t = this.forwardTyped(input, train);
    return {
      leftHidden: Array.from(t.leftHidden),
      rightHidden: Array.from(t.rightHidden),
      concat: Array.from(t.concat),
      integrate: Array.from(t.integrate),
      output: Array.from(t.output),
    };
  }

  predict(input: number[] | Float32Array): { prediction: number; probabilities: number[] } {
    const t = this.forwardTyped(input, false);
    const probs = t.output;
    let bestIdx = 0;
    for (let i = 1; i < probs.length; i++) if (probs[i] > probs[bestIdx]) bestIdx = i;
    return { prediction: bestIdx, probabilities: Array.from(probs) };
  }

  // One sample, one training step. Returns the loss so you can draw it on
  // a chart and stop training when the line stops going down.
  train(input: number[] | Float32Array, target: number[] | Float32Array): number {
    this.step++;
    if (target instanceof Float32Array) {
      this.bufTarget.set(target);
    } else {
      for (let i = 0; i < target.length; i++) this.bufTarget[i] = target[i];
    }
    const t = this.bufTarget;

    const fwd = this.forwardTyped(input, true);
    const left = fwd.leftHidden;
    const right = fwd.rightHidden;
    const concat = fwd.concat;
    const inter = fwd.integrate;
    const out = fwd.output;
    const x = this.bufInput;

    let loss = 0;
    const eps = 1e-9;
    for (let i = 0; i < this.outputSize; i++) {
      if (t[i] !== 0) loss -= t[i] * Math.log(out[i] + eps);
    }

    const dOut = this.bufDOut;
    for (let i = 0; i < this.outputSize; i++) dOut[i] = out[i] - t[i];

    const dInter = this.bufDInter;
    for (let i = 0; i < this.integrateSize; i++) {
      let sum = 0;
      for (let k = 0; k < this.outputSize; k++) {
        sum += this.Wo[k * this.integrateSize + i] * dOut[k];
      }
      dInter[i] = sum * sigmoidDerivative(inter[i]);
    }

    const dConcat = this.bufDConcat;
    const concatLen = this.leftSize + this.rightSize;
    for (let j = 0; j < concatLen; j++) {
      let sum = 0;
      for (let i = 0; i < this.integrateSize; i++) {
        sum += this.Wi[i * concatLen + j] * dInter[i];
      }
      dConcat[j] = sum;
    }

    const dLeft = this.bufDLeft;
    for (let i = 0; i < this.leftSize; i++) dLeft[i] = dConcat[i] * sigmoidDerivative(left[i]);
    const dRight = this.bufDRight;
    for (let i = 0; i < this.rightSize; i++) {
      dRight[i] = dConcat[this.leftSize + i] * tanhDerivative(right[i]);
    }

    if (this.dropout > 0) {
      for (let i = 0; i < this.leftSize; i++) dLeft[i] *= this.bufMaskL[i];
      for (let i = 0; i < this.rightSize; i++) dRight[i] *= this.bufMaskR[i];
      for (let i = 0; i < this.integrateSize; i++) dInter[i] *= this.bufMaskI[i];
    }

    this.applyDenseUpdate(this.Wo, this.bo, this.mWo, this.mbo, this.outputSize, this.integrateSize, dOut, inter);
    this.applyDenseUpdate(this.Wi, this.bi, this.mWi, this.mbi, this.integrateSize, concatLen, dInter, concat);
    this.applyDenseUpdate(this.Wl, this.bl, this.mWl, this.mbl, this.leftSize, this.inputSize, dLeft, x);
    this.applyDenseUpdate(this.Wr, this.br, this.mWr, this.mbr, this.rightSize, this.inputSize, dRight, x);

    return loss;
  }

  private applyDenseUpdate(
    W: Float32Array, b: Float32Array,
    mW: AdamState, mb: AdamState,
    outDim: number, inDim: number,
    delta: Float32Array, input: Float32Array
  ): void {
    const { lr, beta1, beta2, epsilon } = this.opt;
    const t = this.step;
    const bc1 = 1 - Math.pow(beta1, t);
    const bc2 = 1 - Math.pow(beta2, t);

    for (let i = 0; i < outDim; i++) {
      const di = delta[i];
      const rowBase = i * inDim;
      for (let j = 0; j < inDim; j++) {
        const idx = rowBase + j;
        const grad = di * input[j] + this.l2 * W[idx];
        mW.m[idx] = beta1 * mW.m[idx] + (1 - beta1) * grad;
        mW.v[idx] = beta2 * mW.v[idx] + (1 - beta2) * grad * grad;
        const mHat = mW.m[idx] / bc1;
        const vHat = mW.v[idx] / bc2;
        W[idx] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
      }
      const gradB = di;
      mb.m[i] = beta1 * mb.m[i] + (1 - beta1) * gradB;
      mb.v[i] = beta2 * mb.v[i] + (1 - beta2) * gradB * gradB;
      const mHatB = mb.m[i] / bc1;
      const vHatB = mb.v[i] / bc2;
      b[i] -= lr * mHatB / (Math.sqrt(vHatB) + epsilon);
    }
  }

  // Simple mini-batch. We just train one by one and return the average loss.
  // Real frameworks add gradients up first and then update once, which is a
  // bit cleaner, but for the digit demo this version works fine.
  trainBatch(inputs: Array<number[] | Float32Array>, targets: Array<number[] | Float32Array>): number {
    let sum = 0;
    for (let k = 0; k < inputs.length; k++) sum += this.train(inputs[k], targets[k]);
    return sum / inputs.length;
  }

  serialize(): {
    config: { inputSize: number; leftSize: number; rightSize: number; integrateSize: number; outputSize: number };
    weights: { Wl: number[]; bl: number[]; Wr: number[]; br: number[]; Wi: number[]; bi: number[]; Wo: number[]; bo: number[] };
  } {
    return {
      config: {
        inputSize: this.inputSize, leftSize: this.leftSize,
        rightSize: this.rightSize, integrateSize: this.integrateSize,
        outputSize: this.outputSize,
      },
      weights: {
        Wl: Array.from(this.Wl), bl: Array.from(this.bl),
        Wr: Array.from(this.Wr), br: Array.from(this.br),
        Wi: Array.from(this.Wi), bi: Array.from(this.bi),
        Wo: Array.from(this.Wo), bo: Array.from(this.bo),
      },
    };
  }

  loadWeights(weights: ReturnType<DualBrainNN['serialize']>['weights']): void {
    this.Wl.set(weights.Wl); this.bl.set(weights.bl);
    this.Wr.set(weights.Wr); this.br.set(weights.br);
    this.Wi.set(weights.Wi); this.bi.set(weights.bi);
    this.Wo.set(weights.Wo); this.bo.set(weights.bo);
  }
}
