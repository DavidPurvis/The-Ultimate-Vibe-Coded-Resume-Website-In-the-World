import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/scenes/**/logic.ts'],
      // DOM wiring (dialogs, toasts, live regions, pointer chases, mode transactions, test hooks)
      // runs in real browsers under Playwright; the unit gate measures the pure logic only.
      exclude: [
        'src/lib/icons.ts',
        'src/lib/dom.ts',
        'src/lib/announce.ts',
        'src/lib/boot.ts',
        'src/lib/dialog.ts',
        'src/lib/identityCallback.ts',
        'src/lib/mode.ts',
        'src/lib/motion.ts',
        'src/lib/runaway.ts',
        'src/lib/testHooks.ts',
        'src/lib/toast.ts',
      ],
      thresholds: { lines: 90, branches: 85 },
    },
  },
});
