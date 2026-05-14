/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
import { EmotionStatsContainer } from '../styles/styled';
import type { Emotion } from '../types';

interface Props {
  emotion: Emotion;
}

const EmotionStats = ({ emotion }: Props) => {
  return (
    <EmotionStatsContainer>
      <span>density: {emotion.density.toFixed(2)}</span>
      <span>symm: {emotion.symmetry.toFixed(2)}</span>
      <span>complex: {emotion.complexity.toFixed(2)}</span>
    </EmotionStatsContainer>
  );
};

export default EmotionStats;