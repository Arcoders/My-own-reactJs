import { createContext, useContext } from '../Reactisma/hooks';
import type { Theme } from './index';

export const ThemeContext = createContext<Theme>({});
export const ThemeProvider = ThemeContext.Provider;

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
