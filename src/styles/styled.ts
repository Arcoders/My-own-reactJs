import styled from '../libs/StyledComponent';

// ========== Global / Layout ==========
export const Card = styled.div`
  max-width: 1320px;
  width: fit-content;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 3rem;
  padding: 2.2rem 2.8rem;
  box-shadow: 0 20px 40px -15px rgba(0, 10, 30, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.7) inset, 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.4);
`;

export const H1 = styled.h1`
  font-weight: 600;
  font-size: 2.2rem;
  color: #1c1e24;
  margin: 0 0 0.2rem 0;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

export const Subhead = styled.div`
  color: #4f5b68;
  margin-bottom: 1.8rem;
  font-size: 1rem;
  border-bottom: 1px solid rgba(128, 140, 160, 0.2);
  padding-bottom: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-weight: 450;
`;

export const BrainBadge = styled.span`
  background: rgba(30, 40, 60, 0.8);
  color: white;
  border-radius: 30px;
  padding: 0.2rem 1.2rem;
  font-size: 0.8rem;
  font-weight: 500;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 0.5px solid rgba(255,255,255,0.2);
`;

export const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
`;

export const Grid3Col = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 1.8rem;
  align-items: flex-start;
  justify-content: center;
`;

// ========== Left Column ==========
export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex: 0 0 auto;
  width: 304px;
`;

export const CanvasContainer = styled.div`
  background: white;
  border-radius: 2.5rem;
  padding: 12px;
  box-shadow: 0 15px 25px -10px rgba(0, 20, 40, 0.15), 0 2px 5px rgba(0,0,0,0.02);
  border: 1px solid rgba(255, 255, 255, 0.8);
`;

export const DrawCanvas = styled.canvas`
  display: block;
  width: 280px;
  height: 280px;
  border-radius: 2rem;
  background: white;
  cursor: crosshair;
  touch-action: none;
  box-shadow: inset 0 1px 6px rgba(0,0,0,0.02);
`;

export const CanvasActions = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-top: 0.2rem;
  width: 100%;
  justify-content: center;
`;

export const Button = styled.button`
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 0.5px solid rgba(255,255,255,0.8);
  border-radius: 2rem;
  padding: 0.65rem 1.4rem;
  font-weight: 500;
  font-size: 0.95rem;
  color: #1c1e24;
  box-shadow: 0 4px 10px -5px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.7) inset;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: rgba(255,255,255,0.9);
    box-shadow: 0 8px 16px -8px rgba(0,40,80,0.2), 0 0 0 1px rgba(255,255,255,0.9) inset;
    transform: scale(0.98);
  }
`;

export const PrimaryButton = styled(Button)`
  background: #0066cc;
  color: white;
  border: none;
  box-shadow: 0 8px 16px -6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.05);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);

  &:hover {
    background: #0052a3;
    box-shadow: 0 10px 20px -8px rgba(0, 0, 0, 0.3);
  }

  &:focus {
    outline: 2px solid #ffffff80;
    outline-offset: 2px;
  }
`;

export const PreviewMini = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.5rem;
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 0.6rem 1.5rem;
  border-radius: 3rem;
  border: 0.5px solid rgba(255,255,255,0.7);
`;

export const PreviewCanvas = styled.canvas`
  display: block;
  width: 70px;
  height: 70px;
  border-radius: 1rem;
  background: black;
  border: 2px solid white;
  box-shadow: 0 6px 12px -8px #000;
`;

export const PreviewLabel = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
`;

export const EmotionStatsContainer = styled.div`
  display: flex;
  gap: 0.8rem;
  justify-content: space-around;
  margin-top: 0.8rem;
  font-size: 0.8rem;
  background: rgba(235, 245, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 0.5rem;
  border-radius: 2rem;
  border: 0.5px solid rgba(255,255,255,0.6);
`;

// ========== Middle Column ==========
export const MiddleColumn = styled.div`
  flex: 0 0 auto;
  width: 340px;
`;

export const DigitPanel = styled.div`
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 2.5rem;
  padding: 1.2rem 1.2rem;
  box-shadow: 0 10px 20px -12px rgba(0,20,40,0.2), 0 0 0 1px rgba(255,255,255,0.8) inset;
  border: 1px solid rgba(255,255,255,0.4);
`;

export const DigitLabel = styled.div`
  font-weight: 500;
  color: #2c3a4b;
  margin-bottom: 1rem;
  font-size: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

export const SelectedDigitSpan = styled.span`
  background: #102331;
  color: white;
  padding: 0.2rem 1rem;
  border-radius: 40px;
`;

export const DigitButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
`;

export const DigitButton = styled.button<{ selected?: boolean }>`
  width: 52px;
  height: 52px;
  border-radius: 52px;
  font-size: 1.5rem;
  font-weight: 500;
  background: white;
  border: 1px solid rgba(150, 165, 190, 0.3);
  color: #1e2a38;
  box-shadow: 0 2px 8px -4px rgba(0,0,0,0.05);
  padding: 0;
  line-height: 1;
  backdrop-filter: none;
  cursor: pointer;

  ${props => props.selected && `
    background: #007aff;
    border-color: #007aff;
    color: white;
    box-shadow: 0 6px 12px -4px #007aff80;
    transform: scale(1.02);
  `}
`;

export const TrainExtra = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

export const Counter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 3rem;
  padding: 0.2rem 0.2rem 0.2rem 1.2rem;
  border: 0.5px solid rgba(255,255,255,0.8);
`;

export const CounterSpan = styled.span`
  font-weight: 450;
  color: #2b405a;
`;

export const CounterInput = styled.input`
  width: 65px;
  text-align: center;
  border: none;
  background: rgba(255,255,255,0.8);
  border-radius: 2rem;
  padding: 0.5rem;
  font-weight: 500;
  font-size: 0.95rem;
  border: 1px solid transparent;
  &:focus {
    outline: 2px solid #007aff60;
  }
`;

export const MemoryPanel = styled.div`
  background: rgba(230, 240, 250, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 2rem;
  padding: 1rem 1rem;
  margin-top: 1rem;
  border: 0.5px solid rgba(255,255,255,0.6);
`;

export const MemoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #0a2c44;
`;

export const MemoryControlsDiv = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.8rem;
`;

export const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  flex-wrap: wrap;
`;

export const SliderInput = styled.input`
  -webkit-appearance: none;
  background: transparent;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 20px;
    background: white;
    box-shadow: 0 4px 8px -4px #00000040, 0 0 0 1px rgba(0,0,0,0.05);
    margin-top: -8px;
  }
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: rgba(120,140,170,0.2);
    border-radius: 6px;
    border: 0.5px solid rgba(255,255,255,0.5);
  }
`;


// ========== Right Column ==========
export const RightColumn = styled.div`
  flex: 0 0 auto;
  width: 300px;
`;

export const PredictionArea = styled.div`
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 2rem;
  padding: 1.2rem 1.2rem;
  margin-top: 0;
  box-shadow: 0 8px 18px -10px rgba(0,20,40,0.1), 0 0 0 1px rgba(255,255,255,0.8) inset;
  border: 1px solid rgba(255,255,255,0.4);
`;

export const PredictionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  color: #1e2e42;
`;

export const PredictionBadge = styled.span`
  background: #1d2b3f;
  color: white;
  padding: 0.2rem 1.5rem;
  border-radius: 3rem;
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 6px 12px -8px #00000050;
`;

export const ConfidenceBarsContainer = styled.div`
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

export const BarDigit = styled.span`
  width: 1.5rem;
  font-weight: 600;
  color: #234569;
  font-size: 0.9rem;
`;

export const BarFillBg = styled.div`
  flex: 1;
  height: 1.4rem;
  background: rgba(210, 225, 240, 0.5);
  border-radius: 2rem;
  overflow: hidden;
  box-shadow: inset 0 1px 5px rgba(0,0,0,0.03);
`;

export const BarFill = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => props.width}%;
  background: linear-gradient(90deg, #007aff, #5aa5ff);
  border-radius: 2rem;
  transition: width 0.15s ease;
`;

export const BarPercent = styled.span`
  width: 2.8rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #2a4a70;
  text-align: right;
`;


