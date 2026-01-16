import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', '@mui/material', '@emotion/react'],
    alias: {
      '@caretogether/ui-components': resolve(__dirname, '../../ui-components/dist/index.js'),
    },
  },
});
