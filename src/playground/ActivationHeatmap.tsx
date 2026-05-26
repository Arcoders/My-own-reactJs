/** @jsx createElement */
import createElement from '../libs/Reactisma/core/create-element';
import { useEffect, useRef } from '../libs/Reactisma/hooks';

interface Props {
  values: number[];
  label: string;
  width?: number;
  height?: number;
}

/**
 * Render a vector of activations as a 1D heatmap (low = blue, high = red).
 * Used in the playground to inspect the left/right/integration layers as
 * the user draws.
 */
const ActivationHeatmap = ({ values, label, width = 240, height = 24 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || values.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cellW = w / values.length;
    let min = Infinity;
    let max = -Infinity;
    for (const v of values) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const span = max - min || 1;
    for (let i = 0; i < values.length; i++) {
      const norm = (values[i] - min) / span;
      const r = Math.round(255 * norm);
      const b = Math.round(255 * (1 - norm));
      ctx.fillStyle = `rgb(${r}, 80, ${b})`;
      ctx.fillRect(i * cellW, 0, Math.ceil(cellW), h);
    }
  }, [values]);

  return createElement(
    'div',
    { style: { display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0' } },
    createElement(
      'span',
      { style: { width: '90px', fontSize: '11px', color: '#4f5b68' } },
      label
    ),
    createElement('canvas', {
      ref: canvasRef,
      width,
      height,
      style: { borderRadius: '4px', border: '1px solid rgba(0,0,0,0.08)' },
    })
  );
};

(ActivationHeatmap as { displayName?: string }).displayName = 'ActivationHeatmap';
export default ActivationHeatmap;
