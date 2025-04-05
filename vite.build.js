// vite.build.js - Regular UMD build
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/minivue.js'),
      name: 'MiniVue',
      formats: ['umd'],
      fileName: () => 'minivue.js'
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        exports: 'named',
        globals: {
          MiniVue: 'MiniVue'
        },
        name: 'MiniVue'
      }
    }
  }
}); 