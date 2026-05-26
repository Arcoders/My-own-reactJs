/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
import { DrawCanvas } from '../styles/styled';

interface Props {
  canvasRef: { current: HTMLCanvasElement | null };
  width: number;
  height: number;
}

const DrawingCanvas = ({ canvasRef, width, height }: Props) => {
  return <DrawCanvas ref={canvasRef} width={width} height={height} />;
};

export default DrawingCanvas;