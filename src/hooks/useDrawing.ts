/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
const {  useRef, useCallback, useEffect } = Reactisma;

export const useDrawing = (
  width: number,
  height: number,
  onDrawUpdate?: () => void
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const getCanvasCoords = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x: Math.min(width, Math.max(0, x)), y: Math.min(height, Math.max(0, y)) };
  }, [width, height]);

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    const pos = getCanvasCoords(e);
    lastPos.current = pos;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
    ctx.fill();

    onDrawUpdate?.();
  }, [getCanvasCoords, onDrawUpdate]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasCoords(e);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    
    onDrawUpdate?.();
  }, [getCanvasCoords, onDrawUpdate]);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    onDrawUpdate?.();
  }, [onDrawUpdate]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    onDrawUpdate?.();
  }, [width, height, onDrawUpdate]);

  const getInput = useCallback((): number[] => {
    const canvas = canvasRef.current;
    if (!canvas) return new Array(784).fill(0);

    const ctx = canvas.getContext('2d');
    if (!ctx) return new Array(784).fill(0);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const input = new Array(784);

    for (let cellY = 0; cellY < 28; cellY++) {
      for (let cellX = 0; cellX < 28; cellX++) {
        let sum = 0;
        for (let dy = 0; dy < 10; dy++) {
          for (let dx = 0; dx < 10; dx++) {
            const px = cellX * 10 + dx;
            const py = cellY * 10 + dy;
            const idx = (py * width + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            sum += 1 - (r + g + b) / 765;
          }
        }
        input[cellY * 28 + cellX] = sum / 100;
      }
    }

    return input;
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMouseDown = (e: MouseEvent) => startDraw(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDraw();
    const handleMouseLeave = () => stopDraw();
    const handleTouchStart = (e: TouchEvent) => startDraw(e);
    const handleTouchMove = (e: TouchEvent) => draw(e);
    const handleTouchEnd = () => stopDraw();
    const handleTouchCancel = () => stopDraw();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [startDraw, draw, stopDraw]);

  return { canvasRef, clearCanvas, getInput };
};