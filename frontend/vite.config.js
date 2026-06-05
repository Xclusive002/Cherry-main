/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var isDevelopment = process.env.NODE_ENV !== 'production';
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
});
