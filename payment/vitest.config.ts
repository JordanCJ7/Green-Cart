import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/__tests__/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
      ],
    },
    hookTimeout: 120000,
  },
});
