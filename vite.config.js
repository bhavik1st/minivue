// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

// Browser build (UMD format) - This will expose MiniVue as a global variable
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/minivue.js'),
      name: 'MiniVue',
      formats: ['umd'],
      fileName: (format) => 'minivue.js'
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        format: 'umd',
        name: 'MiniVue',
        inlineDynamicImports: true,
        exports: 'named',
        globals: {
          MiniVue: 'MiniVue'
        }
      }
    }
  }
});

// Minified browser build
export const minified = defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/minivue.js'),
      name: 'MiniVue',
      formats: ['umd'],
      fileName: (format) => 'minivue.min.js'
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        format: 'umd',
        name: 'MiniVue',
        inlineDynamicImports: true,
        exports: 'named',
        globals: {
          MiniVue: 'MiniVue'
        }
      }
    }
  }
});

// ESM build for modern bundlers and direct imports
export const esm = defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/minivue.js'),
      name: 'MiniVue',
      formats: ['es'],
      fileName: (format) => 'minivue.esm.js'
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
