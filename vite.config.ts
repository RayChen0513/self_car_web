import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 👈 允許外部連線
    port: 5174,      // 預設為 5173，可自行改
    open: false,     // 啟動時不自動開啟瀏覽器
    allowedHosts: true,
  },
})
