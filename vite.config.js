// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

// Browser build (UMD format) - This will expose MiVue as a global variable
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mivue.js'),
      name: 'MiVue',
      formats: ['umd'],
      fileName: (format) => 'mivue.js'
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        format: 'umd',
        name: 'MiVue',
        inlineDynamicImports: true,
        exports: 'named',
        globals: {
          MiVue: 'MiVue'
        }
      }
    }
  }
});

// Minified browser build
export const minified = defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mivue.js'),
      name: 'MiVue',
      formats: ['umd'],
      fileName: (format) => 'mivue.min.js'
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        format: 'umd',
        name: 'MiVue',
        inlineDynamicImports: true,
        exports: 'named',
        globals: {
          MiVue: 'MiVue'
        }
      }
    }
  }
});

// ESM build for modern bundlers and direct imports
export const esm = defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mivue.js'),
      name: 'MiVue',
      formats: ['es'],
      fileName: (format) => 'mivue.esm.js'
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
