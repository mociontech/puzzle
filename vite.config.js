import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, la funcion de Netlify corre aparte con `npx netlify-cli functions:serve` (puerto 9999).
    // En Netlify (produccion) la ruta /.netlify/functions/* la sirve la plataforma directamente.
    proxy: {
      '/.netlify/functions': { target: 'http://localhost:9999', changeOrigin: true },
    },
  },
})
