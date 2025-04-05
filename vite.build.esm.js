// vite.build.esm.js - ES Module build
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/minivue.js'),
      name: 'MiniVue',
      formats: ['es'],
      fileName: () => 'minivue.esm.js'
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        format: 'es',
        exports: 'named'
      }
    }
  }
}); 