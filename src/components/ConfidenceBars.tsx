/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
import {
  PredictionArea,
  PredictionHeader,
  PredictionBadge,
  ConfidenceBarsContainer,
  BarRow,
  BarDigit,
  BarFillBg,
  BarFill,
  BarPercent
} from '../styles/styled';
import type { Prediction } from '../types';

interface Props {
  prediction: Prediction;
}

const ConfidenceBars = ({ prediction }: Props) => {
  return (
    <PredictionArea>
      <PredictionHeader>
        <span>integrated prediction (net + memory)</span>
        <PredictionBadge>{prediction.digit}</PredictionBadge>
      </PredictionHeader>
      <ConfidenceBarsContainer>
        {prediction.probabilities.map((p, i) => (
          <BarRow key={i}>
            <BarDigit>{i}</BarDigit>
            <BarFillBg>
              <BarFill width={p * 100} />
            </BarFillBg>
            <BarPercent>{(p * 100).toFixed(1)}%</BarPercent>
          </BarRow>
        ))}
      </ConfidenceBarsContainer>
    </PredictionArea>
  );
};

export default ConfidenceBars;