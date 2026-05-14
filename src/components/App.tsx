/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
const { useState, useCallback, useEffect, useRef } = Reactisma;

import { DualBrainNN } from '../classes/DualBrainNN';
import { EmotionalMemory } from '../classes/EmotionalMemory';
import { extractEmotion } from '../utils/emotion';
import type { Emotion, Prediction } from '../types';
import { useDrawing } from '../hooks/useDrawing';
import { useDebounce } from '../hooks/useDebounce';
import DrawingCanvas from './DrawingCanvas';
import PreviewCanvas from './PreviewCanvas';
import EmotionStats from './EmotionStats';
import DigitSelector from './DigitSelector';
import ConfidenceBars from './ConfidenceBars';
import MemoryControls from './MemoryControls';

import {
  Card,
  H1,
  Subhead,
  BrainBadge,
  Grid3Col,
  LeftColumn,
  MiddleColumn,
  RightColumn,
  CanvasActions,
  Button,
  PrimaryButton,
  TrainExtra,
} from '../styles/styled';

const INPUT_SIZE = 784;
const LEFT_SIZE = 32;
const RIGHT_SIZE = 32;
const INTEGRATE_SIZE = 16;
const OUTPUT_SIZE = 10;
const LR = 0.2;

const App = () => {
  const [network, setNetwork] = useState(
    () => new DualBrainNN(INPUT_SIZE, LEFT_SIZE, RIGHT_SIZE, INTEGRATE_SIZE, OUTPUT_SIZE, LR)
  );
  const [memory] = useState(() => new EmotionalMemory(50));
  const [selectedDigit, setSelectedDigit] = useState(0);
  const [emotion, setEmotion] = useState<Emotion>({ density: 0, symmetry: 0, complexity: 0 });
  const [prediction, setPrediction] = useState<Prediction>({ digit: 0, probabilities: new Array(10).fill(0) });
  const [memoryInfluence, setMemoryInfluence] = useState(0.6);
  const [emotionWeight, setEmotionWeight] = useState(0.1);
  const [memoryCount, setMemoryCount] = useState(0);

  const debounce = useDebounce(180);

  const updateFromDrawingRef = useRef<(() => void) | null>(null);

  const { canvasRef: mainCanvasRef, clearCanvas: clearMainCanvas, getInput } = useDrawing(280, 280, () => {
    if (updateFromDrawingRef.current) {
      debounce(updateFromDrawingRef.current);
    }
  });

  const updateFromDrawing = useCallback(() => {
    const input = getInput();
    const newEmotion = extractEmotion(input);
    setEmotion(newEmotion);

    const netPred = network.predict(input);
    let finalProbs = netPred.probabilities.slice();
    if (memory.size() > 0 && memoryInfluence > 0) {
      const memProbs = memory.memoryProb(input, newEmotion, 3, emotionWeight);
      if (memProbs) {
        finalProbs = finalProbs.map((p, i) => (1 - memoryInfluence) * p + memoryInfluence * memProbs[i]);
      }
    }
    const digit = finalProbs.indexOf(Math.max(...finalProbs));
    setPrediction({ digit, probabilities: finalProbs });
  }, [getInput, network, memory, memoryInfluence, emotionWeight]);

  useEffect(() => {
    updateFromDrawingRef.current = updateFromDrawing;
  }, [updateFromDrawing]);

  const handleTrain = useCallback((epochs: number) => {
    const input = getInput();
    const target = new Array(10).fill(0);
    target[selectedDigit] = 1;
    for (let i = 0; i < epochs; i++) {
      network.train(input, target);
    }
    memory.add(input, selectedDigit, extractEmotion(input));
    setMemoryCount(memory.size());
    updateFromDrawing();
  }, [getInput, selectedDigit, network, memory, updateFromDrawing]);

  const handleResetNetwork = useCallback(() => {
    setNetwork(new DualBrainNN(INPUT_SIZE, LEFT_SIZE, RIGHT_SIZE, INTEGRATE_SIZE, OUTPUT_SIZE, LR));
  }, []);

  const handleClearMemory = useCallback(() => {
    memory.clear();
    setMemoryCount(0);
    updateFromDrawing();
  }, [memory, updateFromDrawing]);


  useEffect(() => {
    updateFromDrawing();
  }, []);

  return (
    <Card>
      <H1>Emotional memory · feel the digits</H1>
      <Subhead>
        <span>left and right brain + memory with mathematical emotions</span>
        <BrainBadge>memory: {memoryCount}</BrainBadge>
      </Subhead>

      <Grid3Col>
        <LeftColumn>
          <DrawingCanvas canvasRef={mainCanvasRef} width={280} height={280} />
          <CanvasActions>
            <Button onClick={clearMainCanvas}>clear</Button>
            <Button onClick={handleResetNetwork}>reset brain</Button>
          </CanvasActions>
          <PreviewCanvas input={getInput()} />
          <EmotionStats emotion={emotion} />
        </LeftColumn>

        <MiddleColumn>
          <DigitSelector selectedDigit={selectedDigit} onSelectDigit={setSelectedDigit} />
          <TrainExtra>
            <PrimaryButton onClick={() => handleTrain(10)}>Teach</PrimaryButton>
            <Button onClick={updateFromDrawing}>Predict</Button>
          </TrainExtra>
          <MemoryControls
            memoryCount={memoryCount}
            influence={memoryInfluence}
            onInfluenceChange={setMemoryInfluence}
            emotionWeight={emotionWeight}
            onEmotionWeightChange={setEmotionWeight}
            onClearMemory={handleClearMemory}
          />
        </MiddleColumn>

        <RightColumn>
          <ConfidenceBars prediction={prediction} />
        </RightColumn>
      </Grid3Col>
    </Card>
  );
};

export default App;