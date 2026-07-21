import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://github-helpers.creativecode.com.co',
  outDir: '../public',
  build: {
    format: 'file'
  }
});
