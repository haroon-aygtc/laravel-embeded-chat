import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.NODE_ENV === 'development' ? '/' : process.env.VITE_BASE_PATH || '/',
  define: {
    global: {},
    'process.env': {},
    Buffer: ['buffer', 'Buffer'],
  },
  build: {
    commonjsOptions: {
      exclude: ['sequelize', 'mysql2', 'pg-hstore', 'ws', 'bcryptjs'],
    },
  },
  optimizeDeps: {
    entries: ['src/main.tsx', 'src/tempobook/**/*'],
    include: ['uuid'],
    exclude: ['pg-hstore', 'sequelize', 'mysql2', 'ws', 'bcryptjs'],
  },
  ssr: {
    noExternal: ['sequelize', 'mysql2'],
  },
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer/',
      stream: 'stream-browserify',
      util: 'util/',
      process: 'process/browser',
    },
  },
  server: {
    allowedHosts: process.env.TEMPO === 'true' ? true : undefined,
    proxy: {},
  },
});
