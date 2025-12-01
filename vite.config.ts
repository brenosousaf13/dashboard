import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/proxy-wc': {
        target: 'https://stillgerjeans.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-wc/, ''),
      },
    },
  },
})
