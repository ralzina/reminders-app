import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' 

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const envDir = path.resolve(__dirname, '../');
  const env = loadEnv(mode, envDir, '');

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    envDir: '../',
    server: {
      // Fallback to 'localhost' if VITE_HOST is not set
      host: env.VITE_FRONTEND_HOST || 'localhost',
      // Fallback to 5173 if VITE_PORT is not set (parsed as a number)
      port: parseInt(env.VITE_FRONTEND_PORT || '5173', 10),
    },
  }
})