/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
import {
  MemoryPanel,
  MemoryHeader,
  MemoryControlsDiv,
  SliderRow,
  SliderInput,
  Button 
} from '../styles/styled';

interface Props {
  memoryCount: number;
  influence: number;
  onInfluenceChange: (val: number) => void;
  emotionWeight: number;
  onEmotionWeightChange: (val: number) => void;
  onClearMemory: () => void;
}

const MemoryControls = ({
  memoryCount,
  influence,
  onInfluenceChange,
  emotionWeight,
  onEmotionWeightChange,
  onClearMemory
}: Props) => {
  const influenceId = 'memory-influence-slider';
  const emotionId = 'emotion-weight-slider';

  const handleInfluenceChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onInfluenceChange(parseFloat(target.value));
  };

  const handleEmotionWeightChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onEmotionWeightChange(parseFloat(target.value));
  };

  return (
    <MemoryPanel>
      <MemoryHeader>
        <span>Emotional memory</span>
        <span>{memoryCount}</span>
      </MemoryHeader>
      <MemoryControlsDiv>
        <SliderRow>
          <label htmlFor={influenceId}>memory influence:</label>
          <SliderInput
            id={influenceId}
            aria-label="memory influence"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={influence}
            onChange={handleInfluenceChange}
          />
          <span aria-live="polite">{influence.toFixed(2)}</span>
        </SliderRow>
        <SliderRow>
          <label htmlFor={emotionId}>emotion weight:</label>
          <SliderInput
            id={emotionId}
            aria-label="emotion weight"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={emotionWeight}
            onChange={handleEmotionWeightChange}
          />
          <span aria-live="polite">{emotionWeight.toFixed(2)}</span>
        </SliderRow>
        <Button onClick={onClearMemory}>clear</Button>
      </MemoryControlsDiv>
    </MemoryPanel>
  );
};

export default MemoryControls;