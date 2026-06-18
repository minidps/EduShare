import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // Optional: if your backend URLs don't have /api/ at the start, 
        // you can uncomment the line below to strip it out when forwarding:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});