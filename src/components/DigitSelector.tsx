/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
import {
  DigitPanel,
  DigitLabel,
  SelectedDigitSpan,
  DigitButtons,
  DigitButton
} from '../styles/styled';

interface Props {
  selectedDigit: number;
  onSelectDigit: (digit: number) => void;
}

const DigitSelector = ({ selectedDigit, onSelectDigit }: Props) => {
  return (
    <DigitPanel>
      <DigitLabel>
        <span>Train as digit</span>
        <SelectedDigitSpan>{selectedDigit}</SelectedDigitSpan>
      </DigitLabel>
      <DigitButtons>
        {Array.from({ length: 10 }, (_, i) => (
          <DigitButton
            key={i}
            selected={i === selectedDigit}
            onClick={() => onSelectDigit(i)}
          >
            {i}
          </DigitButton>
        ))}
      </DigitButtons>
    </DigitPanel>
  );
};

export default DigitSelector;