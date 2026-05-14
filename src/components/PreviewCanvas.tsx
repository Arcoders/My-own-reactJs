/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
const { useEffect, useRef } = Reactisma;

import {
  PreviewMini,
  PreviewCanvas as StyledPreviewCanvas,
  PreviewLabel
} from '../styles/styled';

interface Props {
  input: number[];
}

const PreviewCanvas = ({ input }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 84, 84);
    for (let i = 0; i < 784; i++) {
      const row = Math.floor(i / 28);
      const col = i % 28;
      const ink = Math.floor(255 * input[i]);
      ctx.fillStyle = `rgb(${ink}, ${ink}, ${ink})`;
      ctx.fillRect(col * 3, row * 3, 3, 3);
    }
  }, [input]);

  return (
    <PreviewMini>
      <StyledPreviewCanvas ref={canvasRef} width="84" height="84" />
      <PreviewLabel>28x28 input</PreviewLabel>
    </PreviewMini>
  );
};

export default PreviewCanvas;