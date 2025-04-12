// vite.build.js - Regular UMD build
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mivue.js'),
      name: 'MiVue',
      formats: ['umd'],
      fileName: () => 'mivue.js'
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        exports: 'named',
        globals: {
          MiVue: 'MiVue'
        },
        name: 'MiVue'
      }
    }
  }
}); 