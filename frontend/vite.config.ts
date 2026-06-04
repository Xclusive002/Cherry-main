/// <reference types="vite/client" />

declare const process: {
  env: {
    NODE_ENV: string;
  };
};

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isDevelopment = process.env.NODE_ENV !== 'production';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3000,
    proxy: isDevelopment
      ? {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
        }
      : undefined,
  },
})
