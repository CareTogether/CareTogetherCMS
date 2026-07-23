import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { execSync } from 'child_process';

// Get git commit hash
const getCommitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

const port = Number(process.env.PORT) || 3000;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port,
    strictPort: true,
  },
  build: {
    sourcemap: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(getCommitHash()),
  },
});
