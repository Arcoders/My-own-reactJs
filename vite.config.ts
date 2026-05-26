import { defineConfig } from 'vite'

// Vite 8 deprecated direct esbuild JSX options. Each .tsx file declares its own
// /** @jsx Reactisma.createElement */ pragma which esbuild honors. JSX factory
// is also set in tsconfig.app.json for the type checker.
export default defineConfig({})