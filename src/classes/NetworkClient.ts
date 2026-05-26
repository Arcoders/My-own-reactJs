import { DualBrainNN, type AdamConfig } from './DualBrainNN';

interface NetworkShape {
  inputSize: number;
  leftSize: number;
  rightSize: number;
  integrateSize: number;
  outputSize: number;
}

type Options = Partial<AdamConfig> & { l2?: number; dropout?: number };

/**
 * Front door to the neural network. It can run in two ways:
 *
 *   1. Inside a Web Worker, so training does not freeze the screen.
 *   2. Right here on the main thread, for tests and SSR where no Worker
 *      is available.
 *
 * The API is the same for both. The worker is the one I want to use, and
 * we only fall back if the browser refuses to create one. Nobody likes a
 * page that gets stuck while the network is learning.
 */
export class NetworkClient {
  private worker: Worker | null = null;
  private inline: DualBrainNN | null = null;
  private pending = new Map<number, (value: unknown) => void>();
  private nextId = 0;
  private initPromise: Promise<void>;

  constructor(shape: NetworkShape, options?: Options, weights?: ReturnType<DualBrainNN['serialize']>['weights']) {
    const supportsWorker = typeof Worker !== 'undefined' && typeof URL !== 'undefined';
    if (supportsWorker) {
      try {
        this.worker = new Worker(new URL('./NetworkWorker.ts', import.meta.url), { type: 'module' });
        this.worker.addEventListener('message', (e: MessageEvent<{ id: number; payload: unknown }>) => {
          const fn = this.pending.get(e.data.id);
          if (fn) {
            this.pending.delete(e.data.id);
            fn(e.data.payload);
          }
        });
        // Start init now and save the promise. The caller can call
        // predict() or train() right away. We will wait for init to
        // finish inside those methods, so the user does not have to.
        this.initPromise = this.send<{ ok?: true }>('init', { shape, options, weights }).then(() => undefined);
        return;
      } catch {
        // Could not create the worker (maybe CSP, maybe an old browser).
        // No problem: we will run it here in the same thread. Same math,
        // same results, just on the main thread.
      }
    }
    this.inline = new DualBrainNN(
      shape.inputSize,
      shape.leftSize,
      shape.rightSize,
      shape.integrateSize,
      shape.outputSize,
      options
    );
    if (weights) this.inline.loadWeights(weights);
    this.initPromise = Promise.resolve();
  }

  // Use this when you really need to wait until the worker is ready. For
  // example, before starting a benchmark. In inline mode it returns at once.
  ready(): Promise<void> {
    return this.initPromise;
  }

  private send<T = unknown>(type: string, body: object = {}): Promise<T> {
    return new Promise<T>((resolve) => {
      const id = ++this.nextId;
      this.pending.set(id, resolve as (v: unknown) => void);
      this.worker!.postMessage({ type, id, ...body });
    });
  }

  async predict(input: number[]): Promise<{ prediction: number; probabilities: number[] }> {
    if (this.worker) {
      await this.initPromise;
      return this.send('predict', { input });
    }
    return this.inline!.predict(input);
  }

  async train(inputs: number[][], targets: number[][]): Promise<number> {
    if (this.worker) {
      await this.initPromise;
      const { loss } = await this.send<{ loss: number }>('train', { inputs, targets });
      return loss;
    }
    return this.inline!.trainBatch(inputs, targets);
  }

  async serialize(): Promise<ReturnType<DualBrainNN['serialize']>> {
    if (this.worker) {
      await this.initPromise;
      return this.send('serialize');
    }
    return this.inline!.serialize();
  }

  // A simple way out for older code that is not async yet. Only works in
  // inline mode. We cannot make the worker sync without ugly tricks, and
  // those tricks are not worth the trouble.
  predictSync(input: number[]): { prediction: number; probabilities: number[] } {
    if (this.inline) return this.inline.predict(input);
    throw new Error('predictSync requires inline mode; use predict() instead');
  }

  destroy(): void {
    if (this.worker) this.worker.terminate();
    this.worker = null;
    this.inline = null;
  }

  get isWorker(): boolean {
    return this.worker !== null;
  }
}
