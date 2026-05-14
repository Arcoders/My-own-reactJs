import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'react',
    jsxFactory: 'Reactisma.createElement',
    jsxFragment: 'Reactisma.Fragment',
  },
})