import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Root directory
  root: 'src',
  
  // Base public path
  base: '/',
  
  // Development server options
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // Build options
  build: {
    outDir: '../dist',
    emptyOutDir: false
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
}); 