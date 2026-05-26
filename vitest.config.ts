import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/libs/Reactisma/**/*.ts', 'src/libs/StyledComponent/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
    },
  },
  esbuild: {
    jsxFactory: 'Reactisma.createElement',
    jsxFragment: 'Reactisma.Fragment',
  },
});
