// @ts-check
import { defineConfig } from 'astro/config';
import { chunkGraph } from './scripts/build/chunk-graph.mjs';

// Custom domain later? Set SITE_URL + BASE_PATH (e.g. BASE_PATH=/) and add public/CNAME.
const site = process.env.SITE_URL || 'https://davidpurvis.github.io';
const base = process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    // Keep CSS external so the Content-Security-Policy can stay strict (no 'unsafe-inline').
    inlineStylesheets: 'never',
    assets: '_assets',
  },
  vite: {
    plugins: [chunkGraph()],
    build: {
      // Never inline scripts/assets as data: or inline <script>; CSP allows only one hashed boot script.
      assetsInlineLimit: 0,
      cssCodeSplit: true,
    },
  },
  devToolbar: { enabled: false },
});
