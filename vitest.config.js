// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.js'],
    include: [
      'tests/**/*.test.js',
      'src/**/__tests__/**/*.test.js'
    ],
    environment: 'node',
    globals: true
  }
});
