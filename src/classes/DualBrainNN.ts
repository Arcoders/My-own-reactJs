import { sigmoid, sigmoidDerivative, tanh, tanhDerivative } from '../utils/activations';
import { randomMatrix, randomArray } from '../utils/random';
import type { NetworkForwardResult } from '../types';

export class DualBrainNN {
  inputSize: number;
  leftSize: number;
  rightSize: number;
  integrateSize: number;
  outputSize: number;
  lr: number;

  Wl: number[][];
  bl: number[];
  Wr: number[][];
  br: number[];
  Wi: number[][];
  bi: number[];
  Wo: number[][];
  bo: number[];

  constructor(
    inputSize: number,
    leftSize: number,
    rightSize: number,
    integrateSize: number,
    outputSize: number,
    lr = 0.2
  ) {
    this.inputSize = inputSize;
    this.leftSize = leftSize;
    this.rightSize = rightSize;
    this.integrateSize = integrateSize;
    this.outputSize = outputSize;
    this.lr = lr;

    this.Wl = randomMatrix(leftSize, inputSize, -0.4, 0.4);
    this.bl = randomArray(leftSize, -0.2, 0.2);
    this.Wr = randomMatrix(rightSize, inputSize, -0.4, 0.4);
    this.br = randomArray(rightSize, -0.2, 0.2);
    this.Wi = randomMatrix(integrateSize, leftSize + rightSize, -0.3, 0.3);
    this.bi = randomArray(integrateSize, -0.1, 0.1);
    this.Wo = randomMatrix(outputSize, integrateSize, -0.3, 0.3);
    this.bo = randomArray(outputSize, -0.1, 0.1);
  }

  private _leftHemisphere(input: number[]): number[] {
    return this.bl.map((b, i) => {
      const sum = b + this.Wl[i].reduce((acc, w, j) => acc + w * input[j], 0);
      return sigmoid(sum);
    });
  }

  private _rightHemisphere(input: number[]): number[] {
    return this.br.map((b, i) => {
      const sum = b + this.Wr[i].reduce((acc, w, j) => acc + w * input[j], 0);
      return tanh(sum);
    });
  }

  private _concatenate(left: number[], right: number[]): number[] {
    return left.concat(right);
  }

  private _integrationLayer(concat: number[]): number[] {
    return this.bi.map((b, i) => {
      const sum = b + this.Wi[i].reduce((acc, w, j) => acc + w * concat[j], 0);
      return sigmoid(sum);
    });
  }

  private _outputLayer(integrate: number[]): number[] {
    return this.bo.map((b, i) => {
      const sum = b + this.Wo[i].reduce((acc, w, j) => acc + w * integrate[j], 0);
      return sigmoid(sum);
    });
  }

  forward(input: number[]): NetworkForwardResult {
    const left = this._leftHemisphere(input);
    const right = this._rightHemisphere(input);
    const concat = this._concatenate(left, right);
    const integrate = this._integrationLayer(concat);
    const output = this._outputLayer(integrate);
    return { leftHidden: left, rightHidden: right, concat, integrate, output };
  }

  predict(input: number[]): { prediction: number; probabilities: number[] } {
    const { output } = this.forward(input);
    const prediction = output.indexOf(Math.max(...output));
    return { prediction, probabilities: output };
  }

  private _computeOutputDeltas(output: number[], target: number[]): number[] {
    return output.map((o, i) => (o - target[i]) * sigmoidDerivative(o));
  }

  private _computeIntegrationDeltas(integrate: number[], deltaOut: number[]): number[] {
    return integrate.map((_, i) => {
      const error = this.Wo.reduce((sum, WoRow, j) => sum + WoRow[i] * deltaOut[j], 0);
      return error * sigmoidDerivative(integrate[i]);
    });
  }

  private _computeConcatDeltas(deltaInt: number[], leftPlusRight: number): number[] {
    return Array.from({ length: leftPlusRight }, (_, i) =>
      this.Wi.reduce((sum, WiRow) => sum + WiRow[i] * deltaInt[this.Wi.indexOf(WiRow)], 0)
    );
  }

  private _splitDeltas(
    deltaConcat: number[],
    leftHidden: number[],
    rightHidden: number[]
  ): { deltaLeft: number[]; deltaRight: number[] } {
    const deltaLeft = deltaConcat.slice(0, this.leftSize).map((d, i) => d * sigmoidDerivative(leftHidden[i]));
    const deltaRight = deltaConcat.slice(this.leftSize).map((d, i) => d * tanhDerivative(rightHidden[i]));
    return { deltaLeft, deltaRight };
  }

  private _updateOutputWeights(deltaOut: number[], integrate: number[]): void {
    for (let i = 0; i < this.outputSize; i++) {
      for (let j = 0; j < this.integrateSize; j++) {
        this.Wo[i][j] -= this.lr * deltaOut[i] * integrate[j];
      }
      this.bo[i] -= this.lr * deltaOut[i];
    }
  }

  private _updateIntegrationWeights(deltaInt: number[], concat: number[], leftPlusRight: number): void {
    for (let i = 0; i < this.integrateSize; i++) {
      for (let j = 0; j < leftPlusRight; j++) {
        this.Wi[i][j] -= this.lr * deltaInt[i] * concat[j];
      }
      this.bi[i] -= this.lr * deltaInt[i];
    }
  }

  private _updateLeftWeights(deltaLeft: number[], input: number[]): void {
    for (let i = 0; i < this.leftSize; i++) {
      for (let j = 0; j < this.inputSize; j++) {
        this.Wl[i][j] -= this.lr * deltaLeft[i] * input[j];
      }
      this.bl[i] -= this.lr * deltaLeft[i];
    }
  }

  private _updateRightWeights(deltaRight: number[], input: number[]): void {
    for (let i = 0; i < this.rightSize; i++) {
      for (let j = 0; j < this.inputSize; j++) {
        this.Wr[i][j] -= this.lr * deltaRight[i] * input[j];
      }
      this.br[i] -= this.lr * deltaRight[i];
    }
  }

  train(input: number[], target: number[]): void {
    const { leftHidden, rightHidden, concat, integrate, output } = this.forward(input);

    const deltaOut = this._computeOutputDeltas(output, target);
    const deltaInt = this._computeIntegrationDeltas(integrate, deltaOut);
    const leftPlusRight = this.leftSize + this.rightSize;
    const deltaConcat = this._computeConcatDeltas(deltaInt, leftPlusRight);
    const { deltaLeft, deltaRight } = this._splitDeltas(deltaConcat, leftHidden, rightHidden);

    this._updateOutputWeights(deltaOut, integrate);
    this._updateIntegrationWeights(deltaInt, concat, leftPlusRight);
    this._updateLeftWeights(deltaLeft, input);
    this._updateRightWeights(deltaRight, input);
  }
}