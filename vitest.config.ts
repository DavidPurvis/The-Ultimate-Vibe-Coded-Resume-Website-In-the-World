import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/{unit,property,replay,dom}/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.ts',
        'src/domain/**/*.ts',
        'src/doom/logic.ts',
        'src/runtime/persistence.ts',
        'src/runtime/activation.ts',
      ],
      // Build-time helpers (icon inlining, the inline boot strings) are exercised by the build and
      // the scanner, not by unit tests.
      exclude: ['src/lib/icons.ts', 'src/lib/boot.ts'],
      thresholds: {
        lines: 90,
        branches: 85,
        // The case's pure core carries the progress and fairness proofs: hold it higher.
        'src/domain/**': { lines: 95, branches: 90 },
      },
    },
  },
});
