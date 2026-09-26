import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/scenes/**/logic.ts'],
      exclude: ['src/lib/icons.ts', 'src/lib/dom.ts'],
      thresholds: { lines: 90, branches: 85 },
    },
  },
});
