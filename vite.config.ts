import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawHost = (env.HOST || '127.0.0.1').trim().toLowerCase();
  const host = rawHost === '0.0.0.0' || rawHost === '::' || rawHost === 'localhost' ? '127.0.0.1' : rawHost;
  const port = Number(env.PORT || 3000);
  const hmrPort = Number(env.HMR_PORT || 3001);
  const hmrEnabled = env.DISABLE_HMR !== 'true';

  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['motion/react'],
            lucide: ['lucide-react'],
            ui: ['src/components/ui/index.ts']
          }
        }
      }
    },
    server: {
      host,
      port,
      strictPort: true,
      hmr: hmrEnabled
        ? {
            host,
            port: hmrPort,
            protocol: 'ws',
            clientPort: hmrPort,
          }
        : false,
      watch: hmrEnabled ? undefined : null,
    },
  };
});
