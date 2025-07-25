import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AIClientKit',
      fileName: 'ai-client-kit',
    },
  },
  server: {
    open: '/examples/development.html',
  },
});
