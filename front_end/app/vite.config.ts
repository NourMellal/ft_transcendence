import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '~': '/src',
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  server: {
    allowedHosts: ['www.transcendence.fr', 'transcendence.fr'],
    // proxy: {
    //   "/api": {
    //     target: "https://nginx/api",
    //     secure: false,
    //     rewrite: (path) => path.replace(/^\/api/, ""),
    //   },
    // },
  },
});
