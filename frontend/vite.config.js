import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth':           { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/api/textos':         { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/api/tema':           { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/api/contacto':       { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/api/clientes':       { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/api/activar-cuenta': { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/api/notificaciones': { target: 'http://127.0.0.1:8001', changeOrigin: true },
      '/api':     { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/carrito': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ordenes': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
});
