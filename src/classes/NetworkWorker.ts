/**
 * This file runs on its own thread, so training does not block the UI.
 * That is the whole reason this file exists.
 *
 * Inside, it keeps one DualBrainNN and answers four messages: `init`,
 * `train`, `predict`, and `serialize`. Communication is done with
 * postMessage.
 *
 * Vite sees the `new URL(..., import.meta.url)` line in NetworkClient and
 * splits this file into its own chunk for us. We do not need any extra
 * config for that.
 */

import { DualBrainNN, type AdamConfig } from './DualBrainNN';

interface InitMessage {
  type: 'init';
  shape: { inputSize: number; leftSize: number; rightSize: number; integrateSize: number; outputSize: number };
  options?: Partial<AdamConfig> & { l2?: number; dropout?: number };
  weights?: Parameters<DualBrainNN['loadWeights']>[0];
}

interface TrainMessage {
  type: 'train';
  inputs: number[][];
  targets: number[][];
}

interface PredictMessage {
  type: 'predict';
  input: number[];
}

interface SerializeMessage {
  type: 'serialize';
}

type IncomingMessage = (InitMessage | TrainMessage | PredictMessage | SerializeMessage) & {
  id: number;
};

let nn: DualBrainNN | null = null;

function post(id: number, payload: unknown): void {
  (self as unknown as Worker).postMessage({ id, payload });
}

self.addEventListener('message', (event: MessageEvent<IncomingMessage>) => {
  const msg = event.data;
  switch (msg.type) {
    case 'init': {
      const { shape, options, weights } = msg;
      nn = new DualBrainNN(
        shape.inputSize,
        shape.leftSize,
        shape.rightSize,
        shape.integrateSize,
        shape.outputSize,
        options
      );
      if (weights) nn.loadWeights(weights);
      post(msg.id, { ok: true });
      break;
    }
    case 'train': {
      if (!nn) return post(msg.id, { error: 'not initialized' });
      const loss = nn.trainBatch(msg.inputs, msg.targets);
      post(msg.id, { loss });
      break;
    }
    case 'predict': {
      if (!nn) return post(msg.id, { error: 'not initialized' });
      post(msg.id, nn.predict(msg.input));
      break;
    }
    case 'serialize': {
      if (!nn) return post(msg.id, { error: 'not initialized' });
      post(msg.id, nn.serialize());
      break;
    }
  }
});
