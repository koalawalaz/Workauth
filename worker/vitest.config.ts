import { defineConfig } from 'vitest/config';

// The Worker's own config, so vitest doesn't pick up the site's vite.config.ts and
// postcss.config.js from the parent folder (their packages aren't installed here).
export default defineConfig({
  css: { postcss: {} },
  test: { include: ['test/**/*.test.ts'] },
});
