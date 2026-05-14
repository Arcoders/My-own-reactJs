/** @jsx Reactisma.createElement */
import Reactisma from '../libs/Reactisma';
const { useRef, useCallback } = Reactisma;

export const useDebounce = (delay: number) => {
  const timer = useRef<number | null>(null);

  const debounce = useCallback((fn: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, delay);
  }, [delay]) as (fn: () => void) => void;

  return debounce;
};