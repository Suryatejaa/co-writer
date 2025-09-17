import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    rollupOptions: {
      external: []
    }
  },
  resolve: {
    alias: {
      // Add alias to force use of specific rollup module
      '@rollup/rollup-linux-x64-gnu': '@rollup/rollup-linux-x64-gnu'
    }
  }
});