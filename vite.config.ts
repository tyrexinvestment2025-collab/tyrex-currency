import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000'

// Прокси: фронт и бэк доступны через один адрес (нужно для туннеля в Telegram).
// Для внешнего доступа используйте ТОЛЬКО `vite preview` (собранная статика),
// а не dev-сервер — dev-сервер отдаёт исходники из /src.
const proxy = {
  '/api': BACKEND,
  '/static': BACKEND,
  '/socket.io': { target: BACKEND, ws: true },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    proxy,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
    proxy,
  },
})
